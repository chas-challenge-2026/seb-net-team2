import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "@tanstack/react-router";
import Button from "../../../components/Button/Button";
import { AppError } from "../../../errors/AppError";
import LoadingWheel from "../../../components/LoadingState/LoadingWheel";
import styles from './UserDetails.module.css';
import Modal from "../../../components/Modal/Modal";

import { getUserById, deleteUserById } from "../../../services/authService";
import type { ReadUser } from "../../../schemas/userSchema";

export default function UserDetails() {
    const { userId } = useParams({
        from: "/admin/users/$userId",
    });

    const [user, setUser] = useState<ReadUser | null>(null);
    const [error, setError] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    useEffect(() => {
        async function loadUser() {
            const user = await getUserById(
                Number(userId)
            );

            setUser(user);
        }

        loadUser();
    }, [userId]);

    const navigate = useNavigate();

    async function handleDeleteUser() {

        setError("");
        setIsDeleting(true);

        try {
            await deleteUserById(user!.id);

            navigate({
                to: "/admin/users",
            });
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }

            throw new AppError(
                "Unable to delete user."
            );
        } finally {
            setIsDeleting(false);
        }
    }

    if (!user) {
        return <p>Loading user... <LoadingWheel size="medium" /></p>;
    }

    if (error) return <p>{error} <LoadingWheel size="medium" /></p>

    return (
        <div className={styles.layout}>
            <div className={styles.header}>
                <h1>{user.name}</h1>
                <p>{user.email}</p>
                <p>{user.role}</p>
            </div>

            <div className={styles.actions}>
                <Button
                    size="medium"
                    variant="danger"
                    disabled={isDeleting}
                    onClick={() => setIsDeleteModalOpen(true)}
                >
                    Delete user
                </Button>

                <Link
                    to="/admin/users/$userId/edit"
                    params={{
                        userId: user.id.toString(),
                    }}
                >
                    Edit user
                </Link>
            </div>

            <Modal
                isOpen={isDeleteModalOpen}
                title="Delete user"
                onClose={() => setIsDeleteModalOpen(false)}
                footer={
                    <>
                        <Button
                            size="medium"
                            variant="square"
                            onClick={() => setIsDeleteModalOpen(false)}
                        >
                            Cancel
                        </Button>

                        <Button
                            size="medium"
                            variant="danger"
                            onClick={handleDeleteUser}
                        >
                            {isDeleting ? (
                                <span className={styles.deletingContent}>
                                    Deleting... <LoadingWheel size="small" />
                                </span>
                            ) : "Delete user"}
                        </Button>
                    </>
                }
            >
                <p>
                    Are you sure you want to delete {" "}
                    <strong>{user.name}</strong>
                </p>

                <p>This action cannot be undone.</p>
            </Modal>

            {error && (
                <p role="alert" className={styles.error}>
                    {error}
                </p>
            )}
        </div>
    );
}