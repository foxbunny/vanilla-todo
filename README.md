# Yet another TODO app written in plain JavaScript

TODO app is a good basic application that demonstrates a lot of the key 
concepts in web application development. This particular example focuses on 
the use of forms APIs to represent the entire application sate entirely in 
the DOM.

## Running the example

The example file, `index.html` can be opened in your browser normally without 
requiring any development server. You can also use the HTML preview feature in 
your IDE or editor if one is available.

## Running tests

Test are executed in the `test.html` file. This file is opened in the 
browser the same way you would open the `index.html` file. Tests results are 
shown in the console. The actual code of the tests is found in the `tests.js` 
file. The tests are executed with the help of a custom-made test runner 
found in `vanila-tester.js`.

## Screenshot

![Screenshot of the vanilla TODO app](./screenshot.png)

## Concepts

Here are some of the concepts that this applications demonstrates.

### DOM-infused state

State is stored in and represented by the DOM state. We do not store state any
JavaScript variables but as properties/attributes on DOM nodes. This way, we
do not need to perform additional work to synchronize the UI and internal
application sate, as those are on and the same. The DOM becomes the single
source of truth for the application.

### Use of `HTMLFormControlsCollection` interface

Every `<form>` and `<fieldset>` element in the DOM will have an `elements` 
property that implements the 
[`HTMLFormControlsCollection` interface](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormControlsCollection).
This is used throughout the app to quickly access the named inputs, as opposed 
to using `Element.queryString()` and `Element.queryStringAll()` methods.

### Drag-and-drop ordering

Each fieldset represents a task and can be dragged to change the task order. 
We use the [HTML drag and drop API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API) 
for this.

### Use of `innerHTML` for rendering elements

To render the fieldset contents we use the `innerHTML` property. This is 
widely considered an unsafe practice, but it is actually only unsafe in 
cases where user input is directly inserted into the markup. We use an 
`escapeHTML` function to clean the input before inserting into the HTML.
