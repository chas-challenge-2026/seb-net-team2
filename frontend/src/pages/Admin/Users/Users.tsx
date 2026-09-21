import styles from "./Users.module.css";
import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";

import { getAllUsers } from "../../../services/authService";
import type { ReadUser } from "../../../schemas/userSchema";

import Card from "../../../components/Card/Card";
import LoadingWheel from "../../../components/LoadingState/LoadingWheel";

export default function Users() {
    const [users, setUsers] =
        useState<ReadUser[]>([]);

    const [search, setSearch] =
        useState("");

    const [error, setError] =
        useState("");

    const [isLoading, setIsLoading] =
        useState(true);

    useEffect(() => {
        async function getUsers() {
            try {
                setError("");

                const users =
                    await getAllUsers();

                setUsers(users);
            } catch {
                setError(
                    "Unable to load users."
                );
            } finally {
                setIsLoading(false);
            }
        }

        void getUsers();
    }, []);

    const filteredUsers =
        users.filter((user) => {
            const searchValue =
                search.toLowerCase();

            return (
                user.name
                    .toLowerCase()
                    .includes(searchValue) ||
                user.email
                    .toLowerCase()
                    .includes(searchValue) ||
                user.role
                    .toLowerCase()
                    .includes(searchValue)
            );
        });

    return (
        <div className={styles.layout}>
            <header className={styles.pageHeader}>
                <div>
                    <h1>Users</h1>

                    <p className={styles.description}>
                        Manage users and their roles.
                    </p>
                </div>

                <Link
                    to="/admin/users/create"
                    className={styles.createButton}
                >
                    Create user
                </Link>
            </header>

            <section className={styles.usersSection}>
                <div className={styles.toolbar}>
                    <div className={styles.searchWrapper}>
                        <label
                            htmlFor="user-search"
                            className={styles.searchLabel}
                        >
                            Search users
                        </label>

                        <input
                            id="user-search"
                            type="search"
                            placeholder="Search by name, email or role..."
                            value={search}
                            disabled={isLoading}
                            onChange={(event) =>
                                setSearch(
                                    event.target.value
                                )
                            }
                            className={styles.searchInput}
                        />
                    </div>

                    {!isLoading && !error && (
                        <span className={styles.userCount}>
                            {filteredUsers.length}{" "}
                            {filteredUsers.length === 1
                                ? "user"
                                : "users"}
                        </span>
                    )}
                </div>

                {isLoading && (
                    <div
                        className={styles.loadingState}
                        role="status"
                    >
                        <LoadingWheel size="medium" />
                        <p>Loading users...</p>
                    </div>
                )}

                {error && (
                    <div
                        className={styles.errorState}
                        role="alert"
                    >
                        <p>{error}</p>
                    </div>
                )}

                {!isLoading &&
                    !error &&
                    filteredUsers.length === 0 && (
                        <div className={styles.emptyState}>
                            <h2>No users found</h2>
                            <p>
                                Try another search term.
                            </p>
                        </div>
                    )}

                {!isLoading &&
                    !error &&
                    filteredUsers.length > 0 && (
                        <div className={styles.userList}>
                            {filteredUsers.map(
                                (user) => (
                                    <Link
                                        key={user.id}
                                        to="/admin/users/$userId"
                                        params={{
                                            userId:
                                                user.id.toString(),
                                        }}
                                        className={
                                            styles.userLink
                                        }
                                    >
                                        <Card
                                            variant="default"
                                            className={
                                                styles.userCard
                                            }
                                        >
                                            <div
                                                className={
                                                    styles.avatar
                                                }
                                                aria-hidden="true"
                                            >
                                                {user.name
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </div>

                                            <div
                                                className={
                                                    styles.userInfo
                                                }
                                            >
                                                <strong
                                                    className={
                                                        styles.userName
                                                    }
                                                >
                                                    {user.name}
                                                </strong>

                                                <span
                                                    className={
                                                        styles.userEmail
                                                    }
                                                >
                                                    {user.email}
                                                </span>
                                            </div>

                                            <span
                                                className={
                                                    styles.roleBadge
                                                }
                                            >
                                                {user.role}
                                            </span>

                                            <span
                                                className={
                                                    styles.chevron
                                                }
                                                aria-hidden="true"
                                            >
                                                ›
                                            </span>
                                        </Card>
                                    </Link>
                                )
                            )}
                        </div>
                    )}
            </section>
        </div>
    );
}