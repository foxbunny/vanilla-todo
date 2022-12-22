{
  'use strict'

  let
    { testDocument } = window.VANILLA_TESTER

  testDocument('index.html')
    .useCase('Default UI', (ui, done) => {
      ui.countElementsWithLabel('button', 'Add task', 1)
      ui.noElementsWithLabel('form field', 'Task')
      ui.noElementsWithLabel('button', 'Clear completed')
      done()
    })
    .useCase('Add new task', (ui, done) => {
      ui.clickElement('button', 'Add task')
      ui.countElementsWithLabel('button', 'Clear completed', 1)
      ui.countElementsWithLabel('form field', 'Task', 1)
      ui.shouldHaveFocus('form field', 'Task')
      done()
    })
    .useCase('Edit task text', (ui, done) => {
      ui.clickElement('button', 'Add task')
      ui.typeIntoFocusedField('My new task', thenCheckField)
      function thenCheckField() {
        ui.fieldShouldHaveValue('Task', 'My new task')
        done()
      }
    })
    .useCase('Mark task as checked', (ui, done) => {
      ui.clickElement('button', 'Add task')
      ui.clickElement('form field', 'Completed')
      ui.fieldShouldHaveValue('Completed', 'checked')
      done()
    })
    .useCase('Persists across reload', (ui, done) => {
      ui.clickElement('button', 'Add task')
      ui.pasteIntoFocusedField('My new task')
      ui.refresh(thenAssert)
      function thenAssert() {
        ui.countElementsWithLabel('button', 'Clear completed', 1)
        ui.countElementsWithLabel('form field', 'Task', 1)
        ui.fieldShouldHaveValue('Task', 'My new task')
        done()
      }
    })
    .useCase('Add multiple tasks', (ui, done) => {
      ui.clickElement('button', 'Add task')
      ui.clickElement('button', 'Add task')
      ui.clickElement('button', 'Add task')
      ui.countElementsWithLabel('form field', 'Task', 3)
      ui.clickElement('form field', 'Task', 1)
      ui.pasteIntoFocusedField('My first task')
      ui.clickElement('form field', 'Task', 2)
      ui.pasteIntoFocusedField('My second task')
      ui.clickElement('form field', 'Task', 3)
      ui.pasteIntoFocusedField('My last task')
      ui.countElementsWithLabel('button', 'Clear completed', 1)
      ui.countElementsWithLabel('form field', 'Task', 3)
      done()
    })
    .useCase('Remove task', (ui, done) => {
      ui.clickElement('button', 'Add task')
      ui.clickElement('button', 'Add task')
      ui.countElementsWithLabel('form field', 'Task', 2)
      ui.clickElement('form field', 'Task', 1)
      ui.pasteIntoFocusedField('My first task')
      ui.clickElement('form field', 'Task', 2)
      ui.pasteIntoFocusedField('My second task')
      // delete first task
      ui.clickElement('button', 'Delete')
      ui.countElementsWithLabel('form field', 'Task', 1)
      ui.fieldShouldHaveValue('Task', 'My second task')
      // delete last remaining task
      ui.clickElement('button', 'Delete')
      ui.noElementsWithLabel('Task')
      ui.noElementsWithLabel('Clear completed')
      done()
    })
    .useCase('Order tasks by dragging', (ui, done) => {
      ui.clickElement('button', 'Add task')
      ui.clickElement('button', 'Add task')
      ui.clickElement('button', 'Add task')
      ui.clickElement('form field', 'Task', 1)
      ui.pasteIntoFocusedField('My first task')
      ui.clickElement('form field', 'Task', 2)
      ui.pasteIntoFocusedField('My second task')
      ui.clickElement('form field', 'Task', 3)
      ui.pasteIntoFocusedField('My last task')
      ui.grabElementAtPoint(626, 225)
      ui.dragGrabbedElementBy(12, 173, thenDrop)
      function thenDrop() {
        ui.dropElement()
        ui.fieldShouldHaveValue('Task', 'My second task', 1)
        ui.fieldShouldHaveValue('Task', 'My first task', 2)
        done()
      }
    })
    .useCase('Clear completed', (ui, done) => {
      ui.clickElement('button', 'Add task')
      ui.clickElement('button', 'Add task')
      ui.clickElement('button', 'Add task')
      ui.clickElement('form field', 'Task', 1)
      ui.pasteIntoFocusedField('My first task')
      ui.clickElement('form field', 'Task', 2)
      ui.pasteIntoFocusedField('My second task')
      ui.clickElement('form field', 'Task', 3)
      ui.pasteIntoFocusedField('My last task')
      ui.clickElement('form field', 'Completed', 1)
      ui.clickElement('form field', 'Completed', 2)
      ui.clickElement('button', 'Clear completed')
      ui.countElementsWithLabel('form field', 'Task', 1)
      done()
    })
    .run()
}