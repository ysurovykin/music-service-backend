export function registerJob(job: Function, intervalInMinutes: number) {
  setInterval(async () => await job(), intervalInMinutes * 60 * 1000);
}