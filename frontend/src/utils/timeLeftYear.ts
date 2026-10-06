

export function timeLeftYear() {
    const today = Temporal.Now.plainDateTimeISO();
    const newYear = today.daysInYear - today.dayOfYear;
    return newYear;
}