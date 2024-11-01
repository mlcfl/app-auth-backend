# Helpers

## Description

In the architecture of an application, classes that contain logic but are neither repositories, services, nor models are often classified as "helpers." These classes perform specific tasks that do not fit within traditional architectural layers, such as models, repositories, or services.

## Principles

To ensure that helpers remain flexible and effective, it is essential to adhere to several principles:

1. **Safety**
   Helpers should not modify global state or have side effects. They should be pure functions wherever possible.

2. **Independence from context**
   Helpers should be isolated from business logic and the application context. They should not depend on databases, APIs, or other external systems.

3. **Interaction with other helpers**
   Helpers can use other helpers or utilities but should not use services, repositories, models, controllers, routers, APIs, etc.

## Limitations for helpers

Helpers should not:

- **Make database calls**
  Logic related to database access should be implemented in repositories or services. This helps maintain a clear separation of concerns and makes the code more maintainable and testable.

- **Contain business logic**
  All business logic should be encapsulated in services. Helpers can support services but should not determine how the application should behave.

- **Manage state**
  Helpers should not manage the application's state or retain state between calls. They should remain static and independent.

## Difference between helpers and utils

- **Helpers**
  Helpers are classes that may contain complex logic broken down into different methods. One helper can have more than one public method, and it can include methods related to a single entity.

- **Utils**
  Utilities are simple pure functions, each located in a separate file and implementing one function.
