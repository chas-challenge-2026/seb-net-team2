import { Outlet } from '@tanstack/react-router'
import { Navbar } from '../components/Navbar'
import { Sidebar } from '../components/Sidebar'
import styles from '../components/Sidebar.module.css'

export function MainLayout() {
    return(
        <>
        <Navbar />
        <Sidebar />
        <main className={styles.content}>
            <Outlet />
        </main>
        </>
    )
}