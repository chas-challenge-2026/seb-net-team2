import { useState } from "react";

import Card from "../../components/Card/Card";
import CustomerTypeSelector, {
    type CustomerType,
} from "../../components/CustomerTypeSelector/CustomerTypeSelector";

import PrivateRegistration from "./PrivateRegistration";
import CompanyRegistration from "./CompanyRegistration";

import styles from "./Register.module.css";

export default function Register() {
    const [customerType, setCustomerType] =
        useState<CustomerType>("private");

    return (
        <div className={styles.layout}>
            <Card
                variant="default"
                className={styles.registerCard}
            >
                <div className={styles.headerSection}>
                    <h1 className={styles.header}>
                        Welcome to SEB
                    </h1>

                    <div className={styles.line} />
                </div>

                <div className={styles.selectorContainer}>
                    <CustomerTypeSelector
                        value={customerType}
                        onChange={setCustomerType}
                    />
                </div>

                {customerType === "private" ? (
                    <PrivateRegistration />
                ) : (
                    <CompanyRegistration />
                )}
            </Card>
        </div>
    );
}