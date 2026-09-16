import { useState } from "react";
import { Navigate } from "@tanstack/react-router";

import Card from "../../components/Card/Card";
import CustomerTypeSelector, {
    type CustomerType,
} from "../../components/CustomerTypeSelector/CustomerTypeSelector";
import LoadingWheel from "../../components/LoadingState/LoadingWheel";

import PrivateLogin from "./PrivateLogin";
import CompanyLogin from "./CompanyLogin";

import { useAuth } from "../../hooks/useAuth";

import styles from "./Login.module.css";

export default function Login() {
    const [customerType, setCustomerType] =
        useState<CustomerType>("private");

    const {
        isAuthenticated,
        isInitializing,
    } = useAuth();

    if (isInitializing) {
        return (
            <div className={styles.layout}>
                <LoadingWheel size="medium" />
            </div>
        );
    }

    if (isAuthenticated) {
        return <Navigate to="/dashboard" />;
    }

    return (
        <div className={styles.layout}>
            <Card
                variant="image"
                className={styles.centeredCard}
            >
                <div className={styles.selectorContainer}>
                    <CustomerTypeSelector
                        value={customerType}
                        onChange={setCustomerType}
                    />
                </div>

                <div className={styles.line} />

                {customerType === "private" ? (
                    <PrivateLogin />
                ) : (
                    <CompanyLogin />
                )}
            </Card>
        </div>
    );
}