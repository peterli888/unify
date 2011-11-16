/* ***********************************************************************************************

    Unify Project

    Homepage: unify-project.org
    License: MIT + Apache (V2)
    Copyright: 2011, Sebastian Fastner, Mainz, Germany, http://unify-training.com

*********************************************************************************************** */

qx.Mixin.define("unify.ui.core.MChildControl", {
  construct : function() {
    this._applyMChildControl();
  },
  
  members : {
  
    /** {Map} Instantiated child control representations */
    __childControls : null,
  
    /**
     * Checks the child with given ID for availability.
     *
     * @param id {String} ID of the child control
     * @return {Boolean} <code>true</code> if the child control if available
     */
    hasChildControl : function(id) {
      if (!this.__childControls) {
        return false;
      }

      return !!this.__childControls[id];
    },


    /**
     * Returns a map of all already created child controls
     *
     * @return {Map} mapping of child control id to the child widget.
     */
    _getCreatedChildControls : function() {
      return this.__childControls;
    },


    /**
     * Get child control
     *
     * @param id {String} ID of the child control
     * @param notcreate {Boolean?false} If true the widget is created if not existent.
     * @return {unify.ui.core.Widget} Child control
     */
    getChildControl : function(id, notcreate) {
      if (!this.__childControls)
      {
        if (notcreate) {
          return null;
        }

        this.__childControls = {};
      }

      var control = this.__childControls[id];
      if (control) {
        return control;
      }

      if (notcreate === true) {
        return null;
      }

      return this._createChildControl(id);
    },


    /**
     * Shows the given child control by ID
     *
     * @param id {String} ID of the child control
     * @return {unify.ui.core.Widget} the child control
     */
    _showChildControl : function(id) {
      var control = this.getChildControl(id);
      control.show();
      return control;
    },


    /**
     * Excludes the given child control by ID
     *
     * @param id {String} ID of the child control
     */
    _excludeChildControl : function(id) {
      var control = this.getChildControl(id, true);
      if (control) {
        control.exclude();
      }
    },


    /**
     * Whether the given child control is visible.
     *
     * @param id {String} ID of the child control
     * @return {Boolean} <code>true</code> when the child control is visible.
     */
    _isChildControlVisible : function(id) {
      var control = this.getChildControl(id, true);
      if (control) {
        return control.isVisible();
      }

      return false;
    },


    /**
     * Force the creation of the given child control by ID.
     *
     * Do not override this method! Override {@link #_createChildControlImpl}
     * instead if you need to support new controls.
     *
     * @param id {String} ID of the child control
     * @return {unify.ui.core.Widget} The created control
     * @throws when the control was created before
     */
    _createChildControl : function(id) {
      if (!this.__childControls) {
        this.__childControls = {};
      } else if (this.__childControls[id]) {
        throw new Error("Child control '" + id + "' already created!");
      }

      var pos = id.indexOf("#");
      if (pos == -1) {
        var control = this._createChildControlImpl(id);
      } else {
        var control = this._createChildControlImpl(
          id.substring(0, pos), id.substring(pos + 1, id.length)
        );
      }

      if (!control) {
        throw new Error("Unsupported control: " + id);
      }

      // Establish connection to parent
      control.$$subcontrol = id;
      control.$$subparent = this;

      // Support for state forwarding
      var states = this.__states;
      var forward = this._forwardStates;

      if (states && forward && control instanceof qx.ui.core.Widget)
      {
        for (var state in states)
        {
          if (forward[state]) {
            control.addState(state);
          }
        }
      }

      this.fireDataEvent("createChildControl", control);

      // Register control and return
      return this.__childControls[id] = control;
    },


    /**
     * Dispose all registered controls. This is automatically
     * executed by the widget.
     */
    _disposeChildControls : function() {
      var controls = this.__childControls;
      if (!controls) {
        return;
      }

      var Widget = qx.ui.core.Widget;

      for (var id in controls)
      {
        var control = controls[id];
        if (!Widget.contains(this, control)) {
          control.destroy();
        } else {
          control.dispose();
        }
      }

      delete this.__childControls;
    },


    /**
     * Finds and returns the top level control. This is the first
     * widget which is not a child control of any other widget.
     *
     * @return {unify.ui.core.Widget} The top control
     */
    _findTopControl : function() {
      var obj = this;
      while (obj)
      {
        if (!obj.$$subparent) {
          return obj;
        }

        obj = obj.$$subparent;
      }

      return null;
    },
    
    __childControlUpdateAppearanceWrapper : function() {
      var original = this.updateAppearance;
      
      var newFnt = function() {
        original();
        
        // Update child controls
        var controls = this.__childControls;
        if (controls) {
          var obj;
          for (var id in controls) {
            obj = controls[id];
  
            if (obj instanceof unify.ui.core.Widget) {
              obj.updateAppearance();
            }
          }
        }
      };
      
      return qx.lang.Function.bind(newFnt, this);
    },
    
    __childControlAddStateWrapper : function() {
      var original = this.addState;
      
      var newFnt = function(state) {
        original(state);
        
        // Forward state change to child controls
        var forward = this._forwardStates;
        var controls = this.__childControls;
  
        if (forward && forward[state] && controls)
        {
          var control;
          for (var id in controls)
          {
            control = controls[id];
            if (control instanceof unify.ui.core.Widget) {
              controls[id].addState(state);
            }
          }
        }
      };
      
      return qx.lang.Function.bind(newFnt, this);
    },
    
    __childControlRemoveStateWrapper : function() {
      var original = this.removeState;
      
      var newFnt = function(state) {
        original(state);
        
        // Forward state change to child controls
        var forward = this._forwardStates;
        var controls = this.__childControls;
  
        if (forward && forward[state] && controls)
        {
          for (var id in controls)
          {
            var control = controls[id];
            if (control instanceof unify.ui.core.Widget) {
              control.removeState(state);
            }
          }
        }
      };
      
      return qx.lang.Function.bind(newFnt, this);
    },
    
    __childControlReplaceStateWrapper : function() {
      var original = this.replaceState;
      
      var newFnt = function(old, value) {
        original(old, value);
        
        // Forward state change to child controls
        var forward = this._forwardStates;
        var controls = this.__childControls;
  
        if (forward && forward[value] && controls)
        {
          for (var id in controls)
          {
            var control = controls[id];
            if (control instanceof unify.ui.core.Widget) {
              control.replaceState(old, value);
            }
          }
        }
      };
      
      return qx.lang.Function.bind(newFnt, this);
    },
    
    _applyMChildControl : function() {
      this.updateAppearance = this.__childControlUpdateAppearanceWrapper();
      this.addState = this.__childControlAddStateWrapper();
      this.removeState = this.__childControlRemoveStateWrapper();
      this.replaceState = this.__childControlReplaceStateWrapper();
    }
  },
  
  destruct : function() {
    this._disposeChildControls();
  }
});