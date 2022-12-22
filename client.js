{
  'use strict'

  let
    $tasks = document.getElementById('tasks'),
    $addTask = document.getElementById('add-task'),
    $clearCompleted = document.getElementById('clear-completed'),
    $dragGhost = Object.assign(document.createElement('div'), { hidden: true })

  let
    toIterable = $nodeOrCollection => {
      if (!$nodeOrCollection) return []
      if ('length' in $nodeOrCollection) return $nodeOrCollection
      return [$nodeOrCollection]
    },
    debounce = (fn, t = 100) => {
      let timeout
      return (...args) => {
        clearTimeout(timeout)
        timeout = setTimeout(fn, t, ...args)
      }
    },
    escapeHTML = s => s.replace(/</g, '&lt;').replace(/"/g, '&quot;'),
    startFLIP = $ => {
      // More about FLIP animation:
      //
      // https://css-tricks.com/animating-layouts-with-the-flip-technique/

      let initialY = $.offsetTop
      return {
        initialY, // we also return the initial offset as that's used to
                  // calculate whether the dragged task is above or below
                  // the target
        run: () => {
          let
            finalY = $.offsetTop,
            animation = $.animate([
              { transform: `translateY(${initialY - finalY}px` },
              { transform: 'none' },
            ], { duration: 200 })
          // Mark the element as animating so that we can prevent multiple
          // animation for the same element from starting in parallel
          $.isAnimating = true
          // We return a promise that resolves once the animation ends. This
          // gives us synchronization between multiple animations for free via
          // Promise.all().
          return new Promise(res => {
            animation.addEventListener('finish', () => {
              delete $.isAnimating
              res()
            })
          })
        },
      }
    }

  let
    getNextId = () => {
      let lastId = 0
      // More about the 'elements' property:
      // https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormControlsCollection
      for (let $ of toIterable($tasks.elements.id))
        lastId = Math.max(lastId, $.value) // NB: Math.max() coerces strings into numbers
      return lastId + 1
    },
    createTask = ({
      title = '',
      id = getNextId(),
      isCompleted = false,
    }) =>
      Object.assign(document.createElement('fieldset'), {
        draggable: true,
        tabIndex: 0, // allow keyboard focusing for ordering using keyboard shortcuts
        name: 'task', // this allows us to iterate all fieldsets in the form using HTMLFormElements.elements.task
        innerHTML: `
          <div>
            <input name="id" type="hidden" value="${id}">
            
            <label>
              <span>Task:</span>
              <input name="title" type="text" required value="${escapeHTML(title)}">
            </label>
            
            <label>
              <input name="completed" type="checkbox" ${isCompleted ? 'checked' : ''}>
              <span>Completed</span>
            </label>
          </div>
          
          <button type="button" value="delete">Delete</button>
        `,
      }),
    clearCompleted = () => {
      for (let $ of $tasks.querySelectorAll('input[name=completed]:checked'))
        $.closest('fieldset').remove()
    },
    swapElements = ($task, $target) => {
      let
        taskFLIP = startFLIP($task),
        targetFLIP = startFLIP($target)

      if (taskFLIP.initialY > targetFLIP.initialY) $tasks.insertBefore($task, $target)
      else if ($target.nextElementSibling) $tasks.insertBefore($task, $target.nextElementSibling)
      else $tasks.append($task)

      return Promise.all([taskFLIP.run(), targetFLIP.run()])
    },
    markTaskAsDragging = $task => {
      $tasks.$draggedTask = $task
      $task.dataset.dragging = true
    },
    markFormAsDragging = () => {
      $tasks.dataset.dragging = true
    },
    unmarkDraggedTaskAsDragging = () => {
      if ($tasks.$draggedTask) {
        delete $tasks.$draggedTask.dataset.dragging
        delete $tasks.$draggedTask
      }
    },
    unmarkFormAsDragging = () => {
      delete $tasks.dataset.dragging
    },
    quickSwapTasks = ($task, $target) => {
      markTaskAsDragging($task)
      swapElements($task, $target)
        .then(unmarkDraggedTaskAsDragging)
      $task.focus()
    },
    toggleClearCompleted = () => {
      $clearCompleted.hidden = !$tasks.children.length
    },
    deleteTask = $task => {
      $task.nextElementSibling?.focus()
      $task.remove()
      storeTasks()
      toggleClearCompleted()
    }

  let
    storeTasks = () => {
      let data = []
      // More about the 'elements' property:
      // https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormControlsCollection
      for (let $fieldset of toIterable($tasks.elements.task))
        data.push({
          id: $fieldset.elements.id.value,
          title: $fieldset.elements.title.value,
          isCompleted: $fieldset.elements.completed.checked, // for checkboxes we use .checked rather than .value
        })
      localStorage.tasks = JSON.stringify(data)
    },
    loadTasks = () => {
      let data = JSON.parse(localStorage.tasks ?? '[]')
      for (let task of data) $tasks.append(createTask(task))
    }

  $tasks.onclick = ev => {
    let $del = ev.target.closest('button[value=delete]')
    if ($del) deleteTask($del.closest('fieldset'))
  }
  $tasks.oninput = $tasks.onchange = debounce(storeTasks, 300)
  $tasks.ondragstart = ev => {
    markTaskAsDragging(ev.target)
    markFormAsDragging()
    ev.dataTransfer.setDragImage($dragGhost, 0, 0)
  }
  $tasks.ondragover = ev => {
    if (!ev.target.matches('fieldset')) return

    let
      $task = $tasks.$draggedTask,
      $target = ev.target

    if ($task.isAnimating) return
    if ($task === $target) return
    swapElements($task, $target)
  }
  $tasks.ondragend = ev => {
    unmarkDraggedTaskAsDragging()
    unmarkFormAsDragging()
    storeTasks()
  }
  $tasks.onkeydown = ev => {
    if (!ev.target.matches('fieldset')) return

    let $task = ev.target

    switch (ev.code) {
      case 'ArrowUp':
        if (!$task.previousElementSibling) return
        quickSwapTasks($task, $task.previousElementSibling)
        break
      case 'ArrowDown':
        if (!$task.nextElementSibling) return
        quickSwapTasks($task, $task.nextElementSibling)
        break
      case 'Delete':
        $task.nextElementSibling?.focus()
        $task.remove()
        storeTasks()
        toggleClearCompleted()
        break
    }
  }

  $addTask.onclick = () => {
    let $task = createTask({})
    $tasks.append($task)
    storeTasks()
    toggleClearCompleted()
    $task.querySelector('[name=title]').focus()
  }
  $clearCompleted.onclick = clearCompleted
  window.onbeforeunload = storeTasks

  loadTasks()
  toggleClearCompleted()

  document.querySelector('main').hidden = false
}
