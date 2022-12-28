{
  'use strict'

  let
    { testDocument } = window.PokeAtUI

  testDocument('index.html')
    .useCase('Default UI', (ui, done) => {
      ui.countElementsWithLabel('button', 'Add task', 1)
      ui.noElementsMatch('form field', 'Task')
      ui.noElementsMatch('button', 'Clear completed')
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
      ui.noElementsMatch('Task')
      ui.noElementsMatch('Clear completed')
      done()
    })
    .useCase('Order tasks by dragging', (ui, done) => {
      ui.clickElement('button', 'Add task')
      ui.clickElement('button', 'Add task')
      ui.clickElement('button', 'Add task')
      ui.clickElement('button', 'Add task')
      ui.clickElement('form field', 'Task', 1)
      ui.pasteIntoFocusedField('My first task')
      ui.clickElement('form field', 'Task', 2)
      ui.pasteIntoFocusedField('My second task')
      ui.clickElement('form field', 'Task', 3)
      ui.pasteIntoFocusedField('My third task')
      ui.clickElement('form field', 'Task', 4)
      ui.pasteIntoFocusedField('My last task')
      ui.scrollToTop()
      ui.grabElement('area', 'My first task')
      ui.dragGrabbedElementOver('area', 'My last task', thenDrop)
      function thenDrop() {
        ui.dropGrabbedElement()
        ui.fieldShouldHaveValue('Task', 'My second task', 1)
        ui.fieldShouldHaveValue('Task', 'My third task', 2)
        ui.fieldShouldHaveValue('Task', 'My last task', 3)
        ui.fieldShouldHaveValue('Task', 'My first task', 4)
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
