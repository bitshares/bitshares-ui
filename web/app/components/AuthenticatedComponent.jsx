import React from "react";
import BaseComponent from "./BaseComponent";
import SessionStore from "stores/SessionStore";

export default (ComposedComponent) => {
    return class AuthenticatedComponent extends BaseComponent {

      static willTransitionTo(transition) {
          // This method is called before transitioning to this component. If the user is not logged in, we’ll send him or her to the Login page.
          if (!SessionStore.getUnlockState()) {
              transition.redirect("/login", {}, {"nextPath": transition.path});
          }
      }

      constructor(props) {
          super(props, SessionStore);
      }

      render() {
          return (
          <ComposedComponent
            {...this.props}
            userLoggedIn={this.state.isUnlocked} />
          );
      }
    };
};
