import { useState } from "react";
import { Link } from "@tanstack/react-router";

import Card from "../../components/Card/Card";
import Button from "../../components/Button/Button";

import styles from "./LoggaIn.module.css";

export function LoggaIn() {
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [customerType, setCustomerType] =
        useState<"private" | "company">("private");

    function handleEmail(e: React.ChangeEvent<HTMLInputElement>) {
        setEmail(e.target.value);
    }

    function handlePassword(e: React.ChangeEvent<HTMLInputElement>) {
        setPassword(e.target.value);
    }

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (!email || !password) {
            setError("Fyll i både email och lösenord.");
            return;
        }

        setError("");

        console.log(email, password, customerType);
    }

    function handleTypeKeyDown(
        e: React.KeyboardEvent<HTMLDivElement>
    ) {
        if (e.key === "Enter") {
            setCustomerType((prev) =>
                prev === "private" ? "company" : "private"
            );
        }
    }

    return (
        <div className={styles.layout}>
            <Card
                variant="image"
                className={styles.centeredCard}
            >
                <div className={styles.sliderContainer}>
                    <div
                        onKeyDown={handleTypeKeyDown}
                        className={`${styles.slider} ${customerType === "company" ? styles.companySelected : ""
                            }`}
                    >
                        <input
                            id="private"
                            type="radio"
                            name="customerType"
                            value="private"
                            checked={customerType === "private"}
                            onChange={() => setCustomerType("private")}
                        />

                        <label htmlFor="private">
                            Privat
                        </label>

                        <input
                            id="company"
                            type="radio"
                            name="customerType"
                            value="company"
                            checked={customerType === "company"}
                            onChange={() => setCustomerType("company")}
                        />

                        <label htmlFor="company">
                            Företag
                        </label>
                    </div>
                </div>

                {customerType === "private" ? (
                    <form
                        onSubmit={handleSubmit}
                        className={styles.form}
                    >
                        <div className={styles.inputGrid}>
                            <div className={styles.formGroup}>
                                <label
                                    htmlFor="email"
                                    className={styles.label}
                                >
                                    Email
                                </label>

                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="username"
                                    required
                                    placeholder="Email"
                                    value={email}
                                    onChange={handleEmail}
                                    className={styles.input}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label
                                    htmlFor="password"
                                    className={styles.label}
                                >
                                    Lösenord
                                </label>

                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    placeholder="Lösenord"
                                    value={password}
                                    onChange={handlePassword}
                                    className={styles.input}
                                />
                            </div>
                        </div>

                        <div className={styles.actionGrid}>
                            <Button
                                type="submit"
                                variant="square"
                                size="medium"
                                className={styles.formButton}
                            >
                                Logga in
                            </Button>

                            <Link
                                to="/register"
                                className={styles.register}
                                activeProps={{ className: styles.active }}
                            >
                                Inget konto? Registrera dig här.
                            </Link>

                            <p
                                className={styles.error}
                                aria-live="polite"
                            >
                                {error}
                            </p>
                        </div>
                    </form>
                ) : (
                    <div className={styles.companyContent}>
                        <p>Företagsinloggning</p>
                    </div>
                )}
            </Card>
        </div>
    );
}