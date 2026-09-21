import { Outlet, useRouterState } from '@tanstack/react-router'
import { useState } from 'react'
import { NavigationBar } from '../components/Navbar'
import { Sidebar } from '../components/Sidebar'
import styles from '../components/Sidebar.module.css'

export function MainLayout() {
    const pathname = useRouterState({ select: (state) => state.location.pathname })
    const [collapsed, setCollapsed] = useState(true)
    const [lastPathname, setLastPathname] = useState(pathname)

    if (pathname !== lastPathname) {
        setLastPathname(pathname)
        setCollapsed(true)
    }

    return(
        <>
        <NavigationBar />
        <Sidebar collapsed={collapsed} onToggleCollapsed={() => setCollapsed((current) => !current)} />
        <main className={`${styles.content} ${collapsed ? styles.contentCollapsed : ''}`}>
            <Outlet />
        </main>
        </>
    )
}