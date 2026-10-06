import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ChevronRight, Search, UserPlus, Users as UsersIcon } from "lucide-react";

import { getAllUsers } from "../../../services/authService";
import Card from "../../../components/Card/Card";
import Skeleton from "../../../components/LoadingState/Skeleton";

import styles from "./Users.module.css";

function UserSkeleton() {
    return (
        <div className={styles.userSkeleton}>
            <Skeleton width="40px" height="40px" radius="50%" />

            <div className={styles.userSkeletonInfo}>
                <Skeleton width="160px" height="16px" />
                <Skeleton width="240px" height="13px" />
            </div>

            <Skeleton width="80px" height="26px" radius="999px" />
        </div>
    );
}

export default function Users() {
    const { t } = useTranslation();
    const [search, setSearch] = useState("");

    const { data: users = [], isPending, isError } = useQuery({
        queryKey: ["users"],
        queryFn: getAllUsers,
    });

    const filteredUsers = users.filter((user) => {
        const searchValue = search.toLowerCase();
        const roleLabel = t(`users.roles.${user.role}`).toLowerCase();

        return (
            user.name.toLowerCase().includes(searchValue) ||
            user.email.toLowerCase().includes(searchValue) ||
            user.role.toLowerCase().includes(searchValue) ||
            roleLabel.includes(searchValue)
        );
    });

    return (
        <div className={styles.layout}>
            <header className={styles.pageHeader}>
                <div className={styles.titleRow}>
                    <UsersIcon size={28} strokeWidth={2} aria-hidden="true" />

                    <div>
                        <h1>{t("users.list.title")}</h1>
                        <p className={styles.description}>{t("users.list.description")}</p>
                    </div>
                </div>

                <Link to="/admin/users/create" className={styles.createButton}>
                    <UserPlus size={18} strokeWidth={2} aria-hidden="true" />
                    {t("users.list.create")}
                </Link>
            </header>

            <section className={styles.usersSection}>
                <div className={styles.toolbar}>
                    <div className={styles.searchWrapper}>
                        <label htmlFor="user-search" className={styles.searchLabel}>
                            {t("users.list.searchLabel")}
                        </label>

                        <div className={styles.searchInputWrapper}>
                            <Search size={18} strokeWidth={2} aria-hidden="true" />

                            <input
                                id="user-search"
                                type="search"
                                placeholder={t("users.list.searchPlaceholder")}
                                value={search}
                                disabled={isPending}
                                onChange={(event) => setSearch(event.target.value)}
                                className={styles.searchInput}
                            />
                        </div>
                    </div>

                    {!isPending && !isError && (
                        <span className={styles.userCount}>
                            {t("users.list.userCount", { count: filteredUsers.length })}
                        </span>
                    )}
                </div>

                {isPending && (
                    <div
                        className={styles.skeletonList}
                        role="status"
                        aria-label={t("users.list.loading")}
                    >
                        {Array.from({ length: 5 }).map((_, index) => (
                            <UserSkeleton key={index} />
                        ))}
                    </div>
                )}

                {isError && (
                    <div className={styles.errorState} role="alert">
                        <p>{t("users.errors.load")}</p>
                    </div>
                )}

                {!isPending && !isError && filteredUsers.length === 0 && (
                    <div className={styles.emptyState}>
                        <UsersIcon size={32} strokeWidth={1.75} aria-hidden="true" />
                        <h2>{t("users.list.empty.title")}</h2>
                        <p>{t("users.list.empty.description")}</p>
                    </div>
                )}

                {!isPending && !isError && filteredUsers.length > 0 && (
                    <div className={styles.userList}>
                        {filteredUsers.map((user) => (
                            <Link
                                key={user.id}
                                to="/admin/users/$userId"
                                params={{ userId: user.id.toString() }}
                                className={styles.userLink}
                            >
                                <Card variant="default" className={styles.userCard}>
                                    <div className={styles.avatar} aria-hidden="true">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>

                                    <div className={styles.userInfo}>
                                        <strong className={styles.userName}>{user.name}</strong>
                                        <span className={styles.userEmail}>{user.email}</span>
                                    </div>

                                    <span className={styles.roleBadge}>
                                        {t(`users.roles.${user.role}`)}
                                    </span>

                                    <ChevronRight className={styles.chevron} size={20} strokeWidth={2} aria-hidden="true" />
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}