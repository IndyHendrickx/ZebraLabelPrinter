import { ref } from 'vue'

export function usePreviewTimer(onTrigger: () => Promise<void>, delaySeconds = 1) {
  const countdown = ref<number | null>(null)
  let timerId: ReturnType<typeof setInterval> | null = null

  function cancel() {
    if (timerId) {
      clearInterval(timerId)
      timerId = null
    }
    countdown.value = null
  }

  function start() {
    cancel()
    countdown.value = delaySeconds
    timerId = setInterval(async () => {
      if (countdown.value === null) return
      countdown.value--
      if (countdown.value <= 0) {
        cancel()
        await onTrigger()
      }
    }, 1000)
  }

  function manual() {
    cancel()
    void onTrigger()
  }

  return { countdown, start, cancel, manual }
}