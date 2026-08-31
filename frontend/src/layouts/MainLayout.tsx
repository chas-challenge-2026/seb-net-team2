import { Outlet } from '@tanstack/react-router'
import { Navbar } from '../components/Navbar'

export function MainLayout() {
    return(
        <>
        <Navbar />
        <main>
            <Outlet />
        </main>
        </>
    )
}