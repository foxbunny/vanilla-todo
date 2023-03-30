{
  'use strict'

  let
    AUTO_SAVE_DELAY = 300,
    SORT_ANIMATION_DURATION = 200,
    DRAG_SCROLL_TOP_MARGIN = 200,
    DRAG_SCROLL_BOTTOM_MARGIN = 60,
    DRAG_START_DELAY = 1000

  let // Utils
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
            ], { duration: SORT_ANIMATION_DURATION })
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

  let // Data
    dataStoreTasks = data => {
      localStorage.tasks = JSON.stringify(data)
    },
    dataGetTasks = () => {
      return JSON.parse(localStorage.tasks ?? '[]')
    }

  let // View
    $tasks = document.getElementById('tasks'),
    $addTask = document.getElementById('add-task'),
    $clearCompleted = document.getElementById('clear-completed'),
    $dragGhost = Object.assign(document.createElement('div'), { hidden: true }),
    viewGetNextId = () => {
      let lastId = 0
      // More about the 'elements' property:
      // https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormControlsCollection
      for (let $ of toIterable($tasks.elements.id))
        lastId = Math.max(lastId, $.value) // NB: Math.max() coerces strings into numbers
      return lastId + 1
    },
    viewCreateTask = ({
      title = '',
      id = viewGetNextId(),
      isCompleted = false,
    }) =>
      Object.assign(document.createElement('fieldset'), {
        draggable: true,
        tabIndex: 0, // allow keyboard focusing for ordering using keyboard shortcuts
        name: 'task', // this allows us to iterate all fieldsets in the form using HTMLFormElements.elements.task

        // The single div that wraps the entire content of the fieldset is a
        // hack because Firefox does not recognize fieldsets as draggable
        // elements. See the following bug for more information:
        //
        // https://bugzilla.mozilla.org/show_bug.cgi?id=1237971
        //
        // Drag handle helps users on small screens to grab the correct element
        // for dragging.
        innerHTML: `
          <div>
            <div class="drag-handle">
              <span>Drag handle</span>
            </div>
            
            <div class="editable-fields">
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
            
            <button class="delete-task" type="button" value="delete">Delete</button>
          </div>
        `,
      }),
    viewAppendTask = ($task, $parent = $tasks) => {
      $parent.append($task)
      $task.querySelector('[name=title]').focus()
    },
    viewClearCompleted = () => {
      for (let $ of $tasks.querySelectorAll('input[name=completed]:checked'))
        $.closest('fieldset').remove()
    },
    viewSwapElements = ($task, $target) => {
      if ($task.isAnimating) return
      if ($task === $target) return

      let
        taskFLIP = startFLIP($task),
        targetFLIP = startFLIP($target)

      // Temporarily fix the container's height to prevent layout jitter while
      // we swap elements
      $tasks.style.height = `${$tasks.offsetHeight}px`

      if (taskFLIP.initialY > targetFLIP.initialY) $tasks.insertBefore($task, $target)
      else if ($target.nextElementSibling) $tasks.insertBefore($task, $target.nextElementSibling)
      else $tasks.append($task)

      return Promise.all([taskFLIP.run(), targetFLIP.run()]).then(() => {
        // Revert height
        $tasks.style.height = ''
      })
    },
    viewMarkTaskAsDragging = $task => {
      $tasks.$draggedTask = $task
      $task.dataset.dragging = true
    },
    viewMarkFormAsDragging = () => {
      $tasks.dataset.dragging = true
    },
    viewUnmarkDraggedTaskAsDragging = () => {
      if ($tasks.$draggedTask) {
        delete $tasks.$draggedTask.dataset.dragging
        delete $tasks.$draggedTask
      }
    },
    viewUnmarkFormAsDragging = () => {
      delete $tasks.dataset.dragging
    },
    viewQuickSwapTasks = ($task, $target) => {
      viewMarkTaskAsDragging($task)
      viewSwapElements($task, $target)
        .then(viewUnmarkDraggedTaskAsDragging)
      $task.focus()
    },
    viewToggleClearCompleted = () => {
      $clearCompleted.hidden = !$tasks.children.length
    },
    viewDeleteTask = $task => {
      $task.nextElementSibling?.focus()
      $task.remove()
      viewToggleClearCompleted()
    },
    viewGetTaskData = () => {
      let data = []
      // More about the 'elements' property:
      // https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormControlsCollection
      for (let $fieldset of toIterable($tasks.elements.task))
        data.push({
          id: $fieldset.elements.id.value,
          title: $fieldset.elements.title.value,
          isCompleted: $fieldset.elements.completed.checked, // for checkboxes we use .checked rather than .value
        })
      return data
    },
    viewRevealMain = () => {
      document.querySelector('main').hidden = false
    }

  let // Presenters
    presentStoreTask = () => {
      dataStoreTasks(viewGetTaskData())
    },
    presentLoadTask = () => {
      for (let task of dataGetTasks()) viewAppendTask(viewCreateTask(task))
    },
    presentDeleteTask = $task => {
      viewDeleteTask($task)
      presentStoreTask()
    },
    presentStartDrag = $task => {
      viewMarkTaskAsDragging($task)
      viewMarkFormAsDragging()
    },
    presentDragOver = viewSwapElements,
    presentDrop = () => {
      viewUnmarkDraggedTaskAsDragging()
      viewUnmarkFormAsDragging()
      presentStoreTask()
    },
    presentMoveTaskUp = $task => {
      if (!$task.previousElementSibling) return
      viewQuickSwapTasks($task, $task.previousElementSibling)
    },
    presentMoveTaskDown = $task => {
      if (!$task.nextElementSibling) return
      viewQuickSwapTasks($task, $task.nextElementSibling)
    },
    presentAppendNewTask = () => {
      let $task = viewCreateTask({})
      viewAppendTask($task)
      viewToggleClearCompleted()
      presentStoreTask()
    },
    presentClearCompleted = viewClearCompleted,
    presentInitialize = () => {
      presentLoadTask()
      viewToggleClearCompleted()
      viewRevealMain()
    }

  $tasks.onsubmit = ev => ev.preventDefault()
  $tasks.onclick = ev => {
    let $del = ev.target.closest('button[value=delete]')
    if ($del) presentDeleteTask($del.closest('fieldset'))
  }
  $tasks.oninput = $tasks.onchange = debounce(presentStoreTask, AUTO_SAVE_DELAY)

  $tasks.ondragstart = ev => {
    presentStartDrag(ev.target)
    ev.dataTransfer.setDragImage($dragGhost, 0, 0)
  }
  $tasks.ondragenter = ev => {
    let $target = ev.target.closest('fieldset')
    if (!$target) return
    presentDragOver($tasks.$draggedTask, $target)
  }
  $tasks.ondragover = ev => {
    // Present as drop zone
    if (ev.target.matches('fieldset')) ev.preventDefault()
  }
  $tasks.ondragend = () => {
    presentDrop()
    presentStoreTask()
  }
  $tasks.ontouchstart = ev => {
    let $task = ev.touches[0].target
    if (!$task.draggable) return
    ev.preventDefault()
    $tasks.dragStartTimeout = setTimeout(() => {
      presentStartDrag($task)
    }, DRAG_START_DELAY)
  }
  $tasks.ontouchmove = ev => {
    if (!$tasks.$draggedTask) return

    let
      { screenX, screenY } = ev.touches[0],
      $target = document.elementFromPoint(screenX, screenY)?.closest('[draggable]'),
      $task = $tasks.$draggedTask

    if (screenY < DRAG_SCROLL_TOP_MARGIN) window.scrollBy({ top: -DRAG_SCROLL_TOP_MARGIN, behavior: 'smooth' })
    if (screenY > window.innerHeight - DRAG_SCROLL_BOTTOM_MARGIN) window.scrollBy({ top: DRAG_SCROLL_BOTTOM_MARGIN, behavior: 'smooth' })

    presentDragOver($task, $target)
  }
  $tasks.ontouchend = () => {
    if (!$tasks.$draggedTask) return
    clearTimeout($tasks.dragStartTimeout)
    presentDrop()
  }
  $tasks.onkeydown = ev => {
    if (!ev.target.matches('fieldset')) return

    let $task = ev.target

    switch (ev.code) {
      case 'ArrowUp':
        presentMoveTaskUp($task)
        break
      case 'ArrowDown':
        presentMoveTaskDown($task)
        break
      case 'Delete':
        presentDeleteTask($task)
        break
    }
  }
  $addTask.onclick = () => {
    presentAppendNewTask()
  }
  $clearCompleted.onclick = presentClearCompleted
  window.onbeforeunload = presentStoreTask

  presentInitialize()
}
