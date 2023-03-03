export default function truncateNumber(number: any, digit: number) {
  const reg = new RegExp(`(-?\\d+\\.\\d{${digit - 1}})(\\d)`)
  const value = number.toString().match(reg)
  return value ? value[1] : number.toString()
}
