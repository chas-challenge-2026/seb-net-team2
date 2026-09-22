import { useMemo, useState } from 'react'
import Card from '../../components/Card/Card'
import { useAuditLog } from '../../hooks/useAuditLog'
import styles from './Granskningslogg.module.css'

const ALL_USERS = 'all'
const ALL_EVENTS = 'all'
const PAGE_SIZE = 5

function formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString('sv-SE', {
        dateStyle: 'short',
        timeStyle: 'short',
    })
}

export function Granskningslogg() {
    const { data: entries, isLoading, isError } = useAuditLog()

    const [userFilter, setUserFilter] = useState(ALL_USERS)
    const [eventFilter, setEventFilter] = useState(ALL_EVENTS)
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')

    const users = useMemo(() => (
        [...new Set((entries ?? []).map((entry) => entry.user))].sort()
    ), [entries])

    const events = useMemo(() => (
        [...new Set((entries ?? []).map((entry) => entry.action))].sort()
    ), [entries])

    const filteredEntries = useMemo(() => {
        return (entries ?? []).filter((entry) => {
            const entryDate = entry.timestamp.slice(0, 10)
            if (userFilter !== ALL_USERS && entry.user !== userFilter) return false
            if (eventFilter !== ALL_EVENTS && entry.action !== eventFilter) return false
            if (dateFrom && entryDate < dateFrom) return false
            if (dateTo && entryDate > dateTo) return false
            return true
        })
    }, [entries, userFilter, eventFilter, dateFrom, dateTo])

    const hasActiveFilters = userFilter !== ALL_USERS || eventFilter !== ALL_EVENTS || dateFrom !== '' || dateTo !== ''

    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

    const updateUserFilter = (value: string) => {
        setUserFilter(value)
        setVisibleCount(PAGE_SIZE)
    }

    const updateEventFilter = (value: string) => {
        setEventFilter(value)
        setVisibleCount(PAGE_SIZE)
    }

    const updateDateFrom = (value: string) => {
        setDateFrom(value)
        setVisibleCount(PAGE_SIZE)
    }

    const updateDateTo = (value: string) => {
        setDateTo(value)
        setVisibleCount(PAGE_SIZE)
    }

    const resetFilters = () => {
        setUserFilter(ALL_USERS)
        setEventFilter(ALL_EVENTS)
        setDateFrom('')
        setDateTo('')
        setVisibleCount(PAGE_SIZE)
    }

    const visibleEntries = filteredEntries.slice(0, visibleCount)
    const hasMore = visibleCount < filteredEntries.length

    return (
        <section className={styles.page} aria-labelledby="audit-log-title">
            <header className={styles.header}>
                <h1 id="audit-log-title">Audit log</h1>
                <p className={styles.intro}>Event log from the database (note: some events are only logged to a file).</p>
            </header>

            <Card>
            <div className={styles.infoBanner}>
                <strong>Note:</strong> This view only shows events stored in the database.
                Some events (e.g. batch payments and partial approval steps) are only logged to{' '}
                <code>/tmp/audit.log</code> and do not appear here.
            </div>

            {entries && entries.length > 0 && (
                <div className={styles.toolbar}>
                    <div className={styles.filterField}>
                        <label htmlFor="audit-user-filter">User</label>
                        <select
                            id="audit-user-filter"
                            value={userFilter}
                            onChange={(event) => updateUserFilter(event.target.value)}
                        >
                            <option value={ALL_USERS}>All users</option>
                            {users.map((user) => (
                                <option key={user} value={user}>{user}</option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.filterField}>
                        <label htmlFor="audit-event-filter">Event type</label>
                        <select
                            id="audit-event-filter"
                            value={eventFilter}
                            onChange={(event) => updateEventFilter(event.target.value)}
                        >
                            <option value={ALL_EVENTS}>All events</option>
                            {events.map((action) => (
                                <option key={action} value={action}>{action}</option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.filterField}>
                        <label htmlFor="audit-date-from">From date</label>
                        <input
                            id="audit-date-from"
                            type="date"
                            value={dateFrom}
                            onChange={(event) => updateDateFrom(event.target.value)}
                        />
                    </div>
                    <div className={styles.filterField}>
                        <label htmlFor="audit-date-to">To date</label>
                        <input
                            id="audit-date-to"
                            type="date"
                            value={dateTo}
                            onChange={(event) => updateDateTo(event.target.value)}
                        />
                    </div>
                    {hasActiveFilters && (
                        <button type="button" className={styles.resetButton} onClick={resetFilters}>
                            Clear filters
                        </button>
                    )}
                </div>
            )}

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <caption className={styles.visuallyHidden}>Audit log events</caption>
                    <thead>
                        <tr>
                            <th scope="col">Timestamp</th>
                            <th scope="col">User</th>
                            <th scope="col">Event</th>
                            <th scope="col">Entity</th>
                            <th scope="col">Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td className={styles.statusRow} colSpan={5} role="status" aria-live="polite">
                                    Loading audit log…
                                </td>
                            </tr>
                        ) : isError ? (
                            <tr>
                                <td className={styles.statusRow} colSpan={5} role="alert">
                                    Could not load the audit log.
                                </td>
                            </tr>
                        ) : visibleEntries.length > 0 ? (
                            visibleEntries.map((entry) => (
                                <tr key={entry.id}>
                                    <td>{formatTimestamp(entry.timestamp)}</td>
                                    <td>{entry.user}</td>
                                    <td><code className={styles.actionCode}>{entry.action}</code></td>
                                    <td>{entry.entityType} #{entry.entityId}</td>
                                    <td>{entry.description}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td className={styles.statusRow} colSpan={5}>
                                    {entries && entries.length > 0
                                        ? 'No audit log entries match this filter.'
                                        : 'No audit log entries found.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {!isLoading && !isError && filteredEntries.length > 0 && (
                <div className={styles.pagination}>
                    <span className={styles.paginationCount}>
                        Showing {visibleEntries.length} of {filteredEntries.length} entries
                    </span>
                    {hasMore && (
                        <button
                            type="button"
                            className={styles.showMoreButton}
                            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                        >
                            Show more
                        </button>
                    )}
                </div>
            )}
            </Card>

            <p className={styles.footnote}>
                Showing the latest 200 entries. For the full log, also see <code>/tmp/audit.log</code> on the server.
            </p>
        </section>
    )
}
