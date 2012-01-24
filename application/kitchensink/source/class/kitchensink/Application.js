/* ************************************************************************

   kitchensink

   Copyright:
     2010 Deutsche Telekom AG, Germany, http://telekom.com

 ************************************************************************ */

/* ************************************************************************

#asset(kitchensink/*)

************************************************************************ */

/**
 * Unify application class
 */
qx.Class.define("kitchensink.Application",
{
  extend : unify.Application,

  members :
  {
    // overridden
    main : function()
    {
      // Call super class
      this.base(arguments);

      // Set theme
      qx.theme.manager.Meta.getInstance().setTheme(unify.theme.Dark);

      // Configure application
      document.title = "kitchensink";

      // Create view managers
      var MasterViewManager = new unify.view.ViewManager("master");

      // Register your view classes...
      MasterViewManager.register(kitchensink.view.Start, true);

      // Add TabViews or SplitViews...
      var TabView = new unify.view.TabViewManager(MasterViewManager);
      TabView.register(kitchensink.view.Start);

      // Add view manager (or SplitView or TabView) to the root
      this.add(TabView);

      // Add at least one view manager to the navigation managment
      var Navigation = unify.view.Navigation.getInstance();
      Navigation.register(MasterViewManager);
      Navigation.init();
    }
  }
});