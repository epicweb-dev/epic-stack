# React Router DevTools

Date: 2025-05-05

Status: accepted

## Context

Epic Stack uses React Router for routing. React Router is a powerful library,
but it can be difficult to debug and visualize the routing in your application.
This is especially true when you have a complex routing structure with nested
routes, dynamic routes, and you rely on data functions like loaders and actions,
which the Epic Stack does.

It is also hard to know which routes are currently active (which ones are
rendered) and if any if the loaders are triggered when you expect them to be.
This can lead to confusion and frustration and the use of console.log statements
to debug the routing in your application.

This is where the React Router DevTools come in. The React Router DevTools are a
set of tools that do all of these things for you.

React Router has a set of DevTools that help debug and visualize the routing in
your application. The DevTools allow you to see the current route information,
including the current location, the matched routes, and the route hierarchy.
This can be very helpful when debugging your applications. The DevTools also
hook into your server-side by wrapping loaders and actions, allowing you to get
extensive information about the data being loaded and the actions being
dispatched.

## Decision

We will add the React Router DevTools to the Epic Stack. The DevTools will be
added to the project as a development dependency. The DevTools will be used in
development mode only.

The DevTools will be used to enhance the following:

1. Visualize the routing in your application
2. Debug the routing in your application
3. See the returned loader data and action data in the DevTools
4. Open routes in your editor directly from the browser
5. See the route boundaries in your application
6. See cache information returned via headers from your loaders
7. See which loaders/actions are triggered when you navigate to a route
8. and a lot more!

## Consequences

With the addition of the React Router DevTools, you will not have to rely on
console.log statements to debug your routing. The DevTools will provide you with
the tools to ship your applications faster and with more confidence.

The DevTools will also help you visualize the routing in your application, which
can be very helpful in understanding routing in general, and figuring out if
your routes are set up correctly.

They are not included in the production build by default, so you will not have
to worry about them being included in your production bundle. They are only
included in development mode, so you can use them without any negative
performance impact in production.
