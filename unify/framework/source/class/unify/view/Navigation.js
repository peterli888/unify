/* ***********************************************************************************************

    Unify Project

    Homepage: unify-project.org
    License: MIT + Apache (V2)
    Copyright: 2009-2010 Deutsche Telekom AG, Germany, http://telekom.com

*********************************************************************************************** */

/**
 * Manager for navigation of typical iPhone-like applications.
 */
qx.Class.define("unify.view.Navigation",
{
  extend : qx.core.Object,
  type : "singleton",


  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  construct : function()
  {
    this.base(arguments);

    // Initialize storage
    this.__viewManagers = {};
  },




  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __historyInit : null,
    __serializedPath : null,
  
    /*
    ---------------------------------------------------------------------------
      VIEW MANAGER MANAGMENT
    ---------------------------------------------------------------------------
    */

    /**
     * {Map} Maps ID of viewManager to the viewManager instance. IDs must be unique
     * in each navigation object.
     */
    __viewManagers : null,

    /**
     * Adds a view manager to the global navigation. All views
     * of this view manager will be globally accessible by their name.
     *
     * @param viewManager {unify.view.ViewManager} View manager instance
     */
    add : function(viewManager)
    {
      var managerId = viewManager.getId();

      if (qx.core.Environment.get("qx.debug"))
      {
        if (this.__viewManagers[managerId]) {
          throw new Error("ViewManager ID is already used: " + managerId);
        }
      }

      this.__viewManagers[managerId] = viewManager;
      viewManager.addListener("changePath", this.__onSubPathChange, this);
    },


    /**
     * Initialized previous state from history or client-side storage.
     *
     * Should be called by the application as soon as all views are registered.
     */
    init : function()
    {
      // Connect to history managment
      var History = unify.bom.History.getInstance();
      History.addListener("change", this.__onHistoryChange, this);

      // Restore path from storage or use default view
      var path = unify.bom.Storage.get("navigation-path");

      // Call history to initialize application
      this.__historyInit = true;
      History.init(path);
      delete this.__historyInit;

      // Be sure that every view manager which is part of the navigation is correctly initialized
      var managers = this.__viewManagers;
      for (var id in managers) {
        managers[id].init();
      }
    },


    /**
     * Returns the view manager which controls the given view
     *
     * @param viewId {String} ID of view
     * @return {unify.view.ViewManager} Instance of view manager
     */
    getViewManager : function(viewId)
    {
      var managers = this.__viewManagers;
      var manager;
      for (var id in managers)
      {
        manager = managers[id];
        if (manager.hasView(viewId)) {
          return manager;
        }
      }

      return null;
    },




    /*
    ---------------------------------------------------------------------------
      PATH MANAGMENT
    ---------------------------------------------------------------------------
    */

    /** {unify.view.Path} Path object which stores the complete application path */
    __path : null,

    /**
     * Navigates to the given path. Automatically distributes sub paths
     * to the responsible view managers.
     *
     * @param path {unify.view.Path} Path object
     */
    navigate : function(path)
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        if (!(path instanceof unify.view.Path)) {
          throw new Error("Invalid path to navigate() to: " + path);
        }
      }

      var usedManagers = {};
      var lastManagerId = null;
      var managers = this.__viewManagers;
      var managerPath = new unify.view.Path;

      for (var i=0, l=path.length; i<l; i++)
      {
        var fragment = path[i];

        for (var managerId in managers)
        {
          var viewManager = managers[managerId];
          var viewObj = viewManager.getView(fragment.view);
          if (viewObj) {
            break;
          }
        }

        if (qx.core.Environment.get("qx.debug"))
        {
          if (!viewObj) 
          {
            // Navigate to valid path before throwing an exception
            viewManager.navigate(managerPath);
            throw new Error("Could not find view: " + fragment.view);
          }
        }

        if (!lastManagerId) {
          lastManagerId = managerId;
        }

        if (managerId == lastManagerId)
        {
          managerPath.push(fragment);
        }
        else
        {
          if (qx.core.Environment.get("qx.debug"))
          {
            if (managerId in usedManagers) {
              throw new Error("View manager was re-used in two different path. Invalid segment!");
            }
          }

          // Update last manager
          managers[lastManagerId].navigate(managerPath);

          // Reset manager path
          managerPath = new unify.view.Path(fragment);

          // Remember all used managers (for validity analysis)
          usedManagers[managerId] = true;

          // Rotate variable
          lastManagerId = managerId;
        }
      }

      // Process with last one
      viewManager.navigate(managerPath);
    },


    /**
     * Reacts on (local) path changes of all registered view managers
     *
     * @param e {qx.event.type.Event} Event object
     */
    __onSubPathChange : function(e)
    {
      // Do not react on useless changes during initialization phase
      if (this.__historyInit) {
        return;
      }

      var changed = e.getTarget();
      var reset = false;
      var path = this.__path = new unify.view.Path;

      var viewManagers = this.__viewManagers;
      for (var id in viewManagers)
      {
        var manager = viewManagers[id];
        if (reset) {
          manager.reset();
        }

        var localPath = manager.getPath();
        if (localPath != null)
        {
          for (var i=0, l=localPath.length; i<l; i++) {
            path.push(localPath[i])
          }
        }

        // Reset all managers after the changed one
        if (manager == changed) {
          reset = true;
        }
      }

      var joined = this.__serializedPath = path.serialize();
      unify.bom.History.getInstance().setLocation(joined);

      try {
        unify.bom.Storage.set("navigation-path", joined);
      } catch(ex) {
        this.error('failed to store navigation-path'+ex);
      }
    },


    /**
     * Reacts on changes of the browser history.
     *
     * @param e {unify.event.type.History} History event
     */
    __onHistoryChange : function(e)
    {
      var currentLocation = decodeURI(e.getLocation());
      if (currentLocation != "" && currentLocation != this.__serializedPath) {
        this.navigate(unify.view.Path.fromString(currentLocation));
      }
    }
  },




  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function()
  {
    var History = unify.bom.History.getInstance();
    History.removeListener("change", this.__onHistoryChange, this);
  }
});
