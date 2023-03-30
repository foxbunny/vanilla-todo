// @ts-check
const {test, expect} = require('@playwright/test')

test('Default UI state', async ({page}) => {
  await page.goto('/')

  await expect(page.getByText('Add task')).toBeVisible()
  await expect(await page.getByLabel('Title:').count()).toBe(0)
  await expect(await page.getByText('Clear completed')).not.toBeVisible()
})
