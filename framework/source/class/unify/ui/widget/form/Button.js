qx.Class.define("unify.ui.widget.form.Button", {
  extend: unify.ui.widget.basic.Label,

  properties: {
    execute: {
      init: null,
      nullable: false,
      apply: "_applyExecute"
    },
    
    hyperreference: {
      init: null,
      nullable: true,
      apply: "_applyHyperreference"
    },
    
    relation: {
      init: null,
      nullable: true,
      apply: "_applyRelation"
    },
    
    goTo: {
      init: null,
      nullable: true,
      apply: "_applyGoto"
    },
    
    show: {
      init: null,
      nullable: true,
      apply: "_applyShow"
    }
  },
  
  members: {
    getElement : function() {
      var element = this.base(arguments);
      
      var exec = this.getExecute();
      if (exec) {
        element.setAttribute("exec", exec);
      }
      
      var href = this.getHyperreference();
      if (href) {
        element.setAttribute("href", href);
      }
      
      var rel = this.getRelation();
      if (rel) {
        element.setAttribute("rel", rel);
      }
      
      var goTo = this.getGoTo();
      if (goTo) {
        element.setAttribute("goto", goTo);
      }
      
      var show = this.getShow();
      if (show) {
        element.setAttribute("show", show);
      }
      
      return element;
    },
    
    _applyExecute : function(value) {
      if (this._hasElement()) {
        if (value) {
          this.getContentElement().setAttribute("exec", value);
        } else {
          this.getContentElement().removeAttribute("exec");
        }
      }
    },
    
    _applyHyperreference : function(value) {
      if (this._hasElement()) {
        if (value) {
          this.getContentElement().setAttribute("href", value);
        } else {
          this.getContentElement().removeAttribute("href");
        }
      }
    },
    
    _applyRelation : function(value) {
      if (this._hasElement()) {
        if (value) {
          this.getContentElement().setAttribute("rel", value);
        } else {
          this.getContentElement().removeAttribute("rel");
        }
      }
    },
    
    _applyGoto : function(value) {
      if (this._hasElement()) {
        if (value) {
          this.getContentElement().setAttribute("goto", value);
        } else {
          this.getContentElement().removeAttribute("goto");
        }
      }
    },
    
    _applyShow : function(value) {
      if (this._hasElement()) {
        if (value) {
          this.getContentElement().setAttribute("show", value);
        } else {
          this.getContentElement().removeAttribute("show");
        }
      }
    }
  }
});