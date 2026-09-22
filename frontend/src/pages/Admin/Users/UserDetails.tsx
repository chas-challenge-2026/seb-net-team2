import {
    useEffect,
    useState,
} from "react";

import {
    Link,
    useNavigate,
    useParams,
} from "@tanstack/react-router";

import Button from "../../../components/Button/Button";
import LoadingWheel from "../../../components/LoadingState/LoadingWheel";
import Modal from "../../../components/Modal/Modal";

import { AppError } from "../../../errors/AppError";

import {
    deleteUserById,
    getUserById,
} from "../../../services/authService";

import type {
    ReadUser,
} from "../../../schemas/userSchema";

import styles from "./UserDetails.module.css";

import Skeleton from "../../../components/LoadingState/Skeleton";

function UserDetailsSkeleton() {
    return (
        <div className={styles.layout}>
            <header className={styles.pageHeader}>
                <div className={styles.headerSkeleton}>
                    <Skeleton
                        width="220px"
                        height="32px"
                    />

                    <Skeleton
                        width="260px"
                        height="14px"
                    />
                </div>

                <div className={styles.headerActions}>
                    <Skeleton
                        width="100px"
                        height="40px"
                    />

                    <Skeleton
                        width="110px"
                        height="40px"
                    />
                </div>
            </header>

            <section className={styles.detailsSection}>
                <div className={styles.sectionHeader}>
                    <Skeleton
                        width="180px"
                        height="22px"
                    />

                    <div className={styles.sectionDescriptionSkeleton}>
                        <Skeleton
                            width="280px"
                            height="14px"
                        />
                    </div>
                </div>

                <div className={styles.detailsGrid}>
                    <div className={styles.detailItem}>
                        <Skeleton
                            width="50px"
                            height="13px"
                        />

                        <Skeleton
                            width="160px"
                            height="18px"
                        />
                    </div>

                    <div className={styles.detailItem}>
                        <Skeleton
                            width="50px"
                            height="13px"
                        />

                        <Skeleton
                            width="220px"
                            height="18px"
                        />
                    </div>

                    <div className={styles.detailItem}>
                        <Skeleton
                            width="40px"
                            height="13px"
                        />

                        <Skeleton
                            width="80px"
                            height="26px"
                            radius="999px"
                        />
                    </div>

                    <div className={styles.detailItem}>
                        <Skeleton
                            width="70px"
                            height="13px"
                        />

                        <Skeleton
                            width="60px"
                            height="18px"
                        />
                    </div>
                </div>
            </section>
        </div>
    );
}

export default function UserDetails() {
    const { userId } = useParams({
        from: "/admin/users/$userId",
    });

    const navigate = useNavigate();

    const [user, setUser] =
        useState<ReadUser | null>(null);

    const [error, setError] =
        useState("");

    const [isLoading, setIsLoading] =
        useState(true);

    const [isDeleting, setIsDeleting] =
        useState(false);

    const [
        isDeleteModalOpen,
        setIsDeleteModalOpen,
    ] = useState(false);

    useEffect(() => {
        async function loadUser() {
            try {
                setError("");
                setIsLoading(true);

                const fetchedUser =
                    await getUserById(
                        Number(userId)
                    );

                setUser(fetchedUser);
            } catch (error) {
                if (error instanceof AppError) {
                    setError(
                        error.detail ??
                        error.message
                    );
                } else {
                    setError(
                        "Unable to load user."
                    );
                }
            } finally {
                setIsLoading(false);
            }
        }

        void loadUser();
    }, [userId]);

    async function handleDeleteUser() {
        if (!user) {
            return;
        }

        setError("");
        setIsDeleting(true);

        try {
            await deleteUserById(user.id);

            await navigate({
                to: "/admin/users",
            });
        } catch (error) {
            if (error instanceof AppError) {
                setError(
                    error.detail ??
                    error.message
                );
            } else {
                setError(
                    "Unable to delete user."
                );
            }

            setIsDeleteModalOpen(false);
        } finally {
            setIsDeleting(false);
        }
    }

    if (isLoading) {
        return (
            <div
                role="status"
                aria-label="Loading user"
            >
                <UserDetailsSkeleton />
            </div>
        );
    }

    if (!user) {
        return (
            <div className={styles.errorState}>
                <p role="alert">
                    {error || "User could not be found."}
                </p>

                <Link
                    to="/admin/users"
                    className={styles.backLink}
                >
                    ← Back to users
                </Link>
            </div>
        );
    }

    return (
        <div className={styles.layout}>


            <header className={styles.pageHeader}>
                <div>
                    <h1>{user.name}</h1>

                    <p>
                        View and manage user details.
                    </p>
                </div>

                <div className={styles.headerActions}>
                    <Link
                        to="/admin/users/$userId/edit"
                        params={{
                            userId:
                                user.id.toString(),
                        }}
                        className={styles.editButton}
                    >
                        Edit user
                    </Link>

                    <Button
                        size="medium"
                        variant="danger"
                        disabled={isDeleting}
                        onClick={() =>
                            setIsDeleteModalOpen(true)
                        }
                    >
                        Delete user
                    </Button>
                </div>
            </header>

            {error && (
                <div
                    className={styles.error}
                    role="alert"
                >
                    {error}
                </div>
            )}

            <section className={styles.detailsSection}>
                <div className={styles.sectionHeader}>
                    <h2>User information</h2>

                    <p>
                        Account and access details
                        for this user.
                    </p>
                </div>

                <dl className={styles.detailsGrid}>
                    <div className={styles.detailItem}>
                        <dt>Name</dt>
                        <dd>{user.name}</dd>
                    </div>

                    <div className={styles.detailItem}>
                        <dt>Email</dt>
                        <dd>{user.email}</dd>
                    </div>

                    <div className={styles.detailItem}>
                        <dt>Role</dt>
                        <dd>
                            <span
                                className={
                                    styles.roleBadge
                                }
                            >
                                {user.role}
                            </span>
                        </dd>
                    </div>

                    <div className={styles.detailItem}>
                        <dt>Tenant ID</dt>
                        <dd>{user.tenantId}</dd>
                    </div>
                </dl>
            </section>

            <Modal
                isOpen={isDeleteModalOpen}
                title="Delete user"
                onClose={() => {
                    if (!isDeleting) {
                        setIsDeleteModalOpen(false);
                    }
                }}
                footer={
                    <>
                        <Button
                            size="medium"
                            variant="square"
                            disabled={isDeleting}
                            onClick={() =>
                                setIsDeleteModalOpen(false)
                            }
                        >
                            Cancel
                        </Button>

                        <Button
                            size="medium"
                            variant="danger"
                            disabled={isDeleting}
                            onClick={handleDeleteUser}
                        >
                            {isDeleting ? (
                                <span
                                    className={
                                        styles.deletingContent
                                    }
                                >
                                    <LoadingWheel size="small" />
                                    Deleting...
                                </span>
                            ) : (
                                "Delete user"
                            )}
                        </Button>
                    </>
                }
            >
                <p>
                    Are you sure you want to delete{" "}
                    <strong>{user.name}</strong>?
                </p>

                <p>
                    This action cannot be undone.
                </p>
            </Modal>
        </div>
    );
}