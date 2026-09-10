import { useState } from "react";

import Card from "../../components/Card/Card";
import CustomerTypeSelector, {
    type CustomerType,
} from "../../components/CustomerTypeSelector/CustomerTypeSelector";

import PrivateLogin from "./PrivateLogin";
import CompanyLogin from "./CompanyLogin";

import styles from "./Login.module.css";

export default function Login() {
    const [customerType, setCustomerType] =
        useState<CustomerType>("private");

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