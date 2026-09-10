import { Outlet } from '@tanstack/react-router'
import { NavigationBar } from '../components/Navbar'
import { Sidebar } from '../components/Sidebar'
import styles from '../components/Sidebar.module.css'

export function MainLayout() {
    return(
        <>
        <NavigationBar />
        <Sidebar />
        <main className={styles.content}>
            <Outlet />
        </main>
        </>
    )
}