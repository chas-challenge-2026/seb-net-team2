import { useState } from "react";
import { UserPlus } from "lucide-react";

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
                    <div className={styles.headerTitle}>
                        <UserPlus size={22} aria-hidden="true" />
                        <h1 className={styles.header}>
                            Welcome to SEB
                        </h1>
                    </div>

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