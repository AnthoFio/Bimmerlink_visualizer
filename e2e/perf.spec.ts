// Frame rate while panning. Run alone with `npm run e2e:perf`: other tests would skew it.
import { expect, test } from '@playwright/test'
import { openLogText, panFrameRate, wideLog } from './support.ts'

for (const share of [0.95, 0.1]) {
  test(`pans 51k rows x 13 series at 30 fps or more, window ${share * 100}%`, async ({ page }) => {
    await openLogText(page, 'wide.csv', wideLog(13))
    await page.getByRole('button', { name: 'Select all' }).click()
    await expect(page.getByRole('list', { name: 'Legend' }).getByRole('listitem')).toHaveCount(13)

    const fps = await panFrameRate(page, share)

    console.log(`pan ${share * 100}%: ${fps.toFixed(1)} fps`)
    expect(fps).toBeGreaterThanOrEqual(30)
  })
}
