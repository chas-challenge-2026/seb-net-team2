import { useState } from 'react'
import Card from '../../components/Card/Card'
import Button from '../../components/Button/Button'
import styles from './SaveInvest.module.css'

type Tab = 'savings' | 'investments' | 'goals'

const accounts = [
    { name: 'Emergency fund', balance: 125000, rate: '2.85%' },
    { name: 'Long-term savings', balance: 299000, rate: '3.50%' },
    { name: 'Holiday savings', balance: 42000, rate: '2.40%' },
]

const goals = [
    { name: 'New home', saved: 185000, target: 350000 },
    { name: 'Summer holiday', saved: 18000, target: 30000 },
]

export function SaveInvest() {
    const [activeTab, setActiveTab] = useState<Tab>('savings')
    const [actionMessage, setActionMessage] = useState<string | null>(null)
    const [accountList, setAccountList] = useState(accounts)
    const [goalList, setGoalList] = useState(goals)
    const [showAllAccounts, setShowAllAccounts] = useState(false)
    const [modal, setModal] = useState<'account' | 'goal' | 'manage' | null>(null)
    const [accountName, setAccountName] = useState('')
    const [goalName, setGoalName] = useState('')
    const [goalTarget, setGoalTarget] = useState('')
    const [selectedAccount, setSelectedAccount] = useState<typeof accounts[number] | null>(null)
    const totalSaved = accountList.reduce((sum, account) => sum + account.balance, 0)

    function showActionMessage(message: string) {
        setActionMessage(message)
    }

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div>
                    <p className={styles.eyebrow}>SAVINGS & INVESTMENTS</p>
                    <h1>Save and invest</h1>
                    <p>Build your financial future with simple, flexible options.</p>
                </div>
                <Button size="medium" onClick={() => setModal('account')}>Open a savings account</Button>
            </header>

            {actionMessage && (
                <div className={styles.actionMessage} role="status">
                    <span>{actionMessage}</span>
                    <button type="button" onClick={() => setActionMessage(null)} aria-label="Dismiss message">×</button>
                </div>
            )}

            <nav className={styles.tabs} aria-label="Savings navigation">
                {(['savings', 'investments', 'goals'] as Tab[]).map(tab => (
                    <button
                        key={tab}
                        className={activeTab === tab ? styles.activeTab : ''}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab === 'savings' ? 'Savings' : tab === 'investments' ? 'Investments' : 'Savings goals'}
                    </button>
                ))}
            </nav>

            {activeTab === 'savings' && (
                <>
                    <section className={styles.heroCard}>
                        <div>
                            <span>Total saved</span>
                            <strong>{totalSaved.toLocaleString('en-SE')} SEK</strong>
                            <p>Across your savings accounts</p>
                        </div>
                        <div className={styles.heroMetric}>
                            <span>Interest earned this year</span>
                            <strong>+8 420 SEK</strong>
                        </div>
                    </section>

                    <section>
                        <div className={styles.sectionHeader}>
                            <div>
                                <h2>Your savings accounts</h2>
                                <p>Manage your savings and interest rates.</p>
                            </div>
                            <Button variant="ghost" size="small" onClick={() => setShowAllAccounts(current => !current)}>{showAllAccounts ? 'Show less' : 'View all'}</Button>
                        </div>
                        <div className={styles.accountGrid}>
                            {accountList.slice(0, showAllAccounts ? accountList.length : 2).map(account => (
                                <Card key={account.name} className={styles.accountCard}>
                                    <span className={styles.cardLabel}>{account.name}</span>
                                    <strong>{account.balance.toLocaleString('en-SE')} SEK</strong>
                                    <span className={styles.rate}>{account.rate} interest rate</span>
                                    <Button variant="ghost" size="small" onClick={() => { setSelectedAccount(account); setModal('manage') }}>Manage account</Button>
                                </Card>
                            ))}
                        </div>
                    </section>
                </>
            )}

            {activeTab === 'investments' && (
                <section className={styles.contentGrid}>
                    <Card title="Investment overview" variant="primary">
                        <div className={styles.investmentTotal}>412 800 SEK</div>
                        <p className={styles.muted}>Current portfolio value</p>
                        <div className={styles.positive}>+6.4% this year</div>
                    </Card>
                    <Card title="Portfolio allocation">
                        <div className={styles.allocation}><span><i className={styles.equity} /> Equities</span><strong>60%</strong></div>
                        <div className={styles.allocation}><span><i className={styles.funds} /> Funds</span><strong>30%</strong></div>
                        <div className={styles.allocation}><span><i className={styles.bonds} /> Bonds</span><strong>10%</strong></div>
                    </Card>
                </section>
            )}

            {activeTab === 'goals' && (
                <section>
                    <div className={styles.sectionHeader}>
                        <div>
                            <h2>Your savings goals</h2>
                            <p>Track progress towards the things that matter.</p>
                        </div>
                        <Button size="small" onClick={() => setModal('goal')}>Add savings goal</Button>
                    </div>
                    <div className={styles.goalGrid}>
                        {goalList.map(goal => {
                            const progress = Math.round((goal.saved / goal.target) * 100)
                            return (
                                <Card key={goal.name} title={goal.name}>
                                    <div className={styles.goalAmounts}>
                                        <strong>{goal.saved.toLocaleString('en-SE')} SEK</strong>
                                        <span>of {goal.target.toLocaleString('en-SE')} SEK</span>
                                    </div>
                                    <div className={styles.progressTrack}><div style={{ width: `${progress}%` }} /></div>
                                    <span className={styles.muted}>{progress}% complete</span>
                                </Card>
                            )
                        })}
                    </div>
                </section>
            )}

            {modal && (
                <div className={styles.modalBackdrop} role="presentation">
                    <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="save-invest-modal-title">
                        <button className={styles.closeButton} type="button" onClick={() => setModal(null)} aria-label="Close">×</button>
                        {modal === 'account' && (
                            <>
                                <p className={styles.eyebrow}>NEW ACCOUNT</p>
                                <h2 id="save-invest-modal-title">Open a savings account</h2>
                                <p className={styles.muted}>Create a mock savings account to see it in your overview.</p>
                                <label className={styles.modalLabel}>Account name
                                    <input value={accountName} onChange={event => setAccountName(event.target.value)} placeholder="e.g. Travel fund" />
                                </label>
                                <Button onClick={() => {
                                    if (!accountName.trim()) return
                                    setAccountList(current => [...current, { name: accountName.trim(), balance: 0, rate: '2.40%' }])
                                    setAccountName('')
                                    setModal(null)
                                    showActionMessage('Savings account created.')
                                }}>Create account</Button>
                            </>
                        )}
                        {modal === 'goal' && (
                            <>
                                <p className={styles.eyebrow}>NEW GOAL</p>
                                <h2 id="save-invest-modal-title">Add a savings goal</h2>
                                <label className={styles.modalLabel}>Goal name
                                    <input value={goalName} onChange={event => setGoalName(event.target.value)} placeholder="e.g. New car" />
                                </label>
                                <label className={styles.modalLabel}>Target amount
                                    <input type="number" min="1" value={goalTarget} onChange={event => setGoalTarget(event.target.value)} placeholder="50000" />
                                </label>
                                <Button onClick={() => {
                                    const target = Number(goalTarget)
                                    if (!goalName.trim() || !target) return
                                    setGoalList(current => [...current, { name: goalName.trim(), saved: 0, target }])
                                    setGoalName('')
                                    setGoalTarget('')
                                    setModal(null)
                                    showActionMessage('Savings goal created.')
                                }}>Create goal</Button>
                            </>
                        )}
                        {modal === 'manage' && selectedAccount && (
                            <>
                                <p className={styles.eyebrow}>ACCOUNT</p>
                                <h2 id="save-invest-modal-title">{selectedAccount.name}</h2>
                                <p className={styles.investmentTotal}>{selectedAccount.balance.toLocaleString('en-SE')} SEK</p>
                                <p className={styles.muted}>Interest rate: {selectedAccount.rate}</p>
                                <Button variant="ghost" onClick={() => { setModal(null); showActionMessage('Account details opened.') }}>Done</Button>
                            </>
                        )}
                    </section>
                </div>
            )}
        </div>
    )
}