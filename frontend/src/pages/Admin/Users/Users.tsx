import styles from "./Users.module.css";
import { useState, useEffect } from "react";

import { getAllUsers } from "../../../services/authService";
import type { ReadUser } from "../../../schemas/userSchema";

import Card from "../../../components/Card/Card";
import { Link } from "@tanstack/react-router";

export default function Users() {



    const [users, setUsers] = useState<ReadUser[]>([]);
    const [search, setSearch] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        async function getUsers() {
            try {
                const users = await getAllUsers();

                setUsers(users);
            } catch {
                setError("Unable to load users.");
            }
        }

        getUsers();
    }, []);



    const filteredUsers = users.filter((user) => {
        const searchValue = search.toLowerCase();

        return (
            user.name.toLowerCase().includes(searchValue) ||
            user.email.toLowerCase().includes(searchValue) ||
            user.role.toLowerCase().includes(searchValue)
        );
    });

    return (
        <div className={styles.layout}>
            <h1 className={styles.header}>
                Users
            </h1>

            <input
                type="text"
                placeholder="Search for user..."
                value={search}
                onChange={(event) =>
                    setSearch(event.target.value)
                }
            />

            {error && <p>{error}</p>}

            {filteredUsers.map((user) => (
                <Link
                    key={user.id}
                    to="/admin/users/$userId"
                    params={{
                        userId: user.id.toString(),
                    }}
                    className={styles.userLink}
                >
                    <Card
                        variant="default"
                        className={styles.userCard}
                    >
                        {user.name} - {user.email} - {user.role}
                    </Card>
                </Link>
            ))}
        </div>
    );
}