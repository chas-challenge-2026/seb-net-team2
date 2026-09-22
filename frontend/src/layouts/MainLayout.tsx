import { Outlet } from '@tanstack/react-router'
import { useState } from 'react'

import { NavigationBar } from '../components/Navbar'
import { Sidebar } from '../components/Sidebar'

import styles from '../components/Sidebar.module.css'

export function MainLayout() {
    const [collapsed, setCollapsed] = useState(false)

    function handleToggleCollapsed() {
        setCollapsed((current) => !current)
    }

    return (
        <>
            <NavigationBar />

            <Sidebar
                collapsed={collapsed}
                onToggleCollapsed={handleToggleCollapsed}
            />

            <main
                className={`${styles.content} ${collapsed
                    ? styles.contentCollapsed
                    : ''
                    }`}
            >
                <Outlet />
            </main>
        </>
    )
}