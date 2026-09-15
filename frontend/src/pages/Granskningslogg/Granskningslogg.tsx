import { useAuditLog } from '../../hooks/useAuditLog'
import styles from './Granskningslogg.module.css'

function formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString('sv-SE', {
        dateStyle: 'short',
        timeStyle: 'short',
    })
}

export function Granskningslogg() {
    const { data: entries, isLoading, isError } = useAuditLog()

    return (
        <section className={styles.page} aria-labelledby="audit-log-title">
            <header className={styles.header}>
                <h1 id="audit-log-title">Audit log</h1>
                <p className={styles.intro}>Event log from the database (note: some events are only logged to a file).</p>
            </header>

            <div className={styles.infoBanner}>
                <strong>Note:</strong> This view only shows events stored in the database.
                Some events (e.g. batch payments and partial approval steps) are only logged to{' '}
                <code>/tmp/audit.log</code> and do not appear here.
            </div>

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
                        ) : entries && entries.length > 0 ? (
                            entries.map((entry) => (
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
                                    No audit log entries found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <p className={styles.footnote}>
                Showing the latest 200 entries. For the full log, also see <code>/tmp/audit.log</code> on the server.
            </p>
        </section>
    )
}
