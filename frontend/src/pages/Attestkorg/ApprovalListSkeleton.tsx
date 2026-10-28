import Skeleton from "../../components/LoadingState/Skeleton";

import styles from "./Attestkorg.module.css";

// Grey placeholder rows while the list loads, like the skeleton in the admin user list.
// The label is read out by screen readers; the rows themselves are hidden from them.
export function ApprovalListSkeleton({ label, rows = 3 }: { label: string; rows?: number }) {
    return (
        <div className={styles.list} role="status">
            <span className="visually-hidden">{label}</span>

            {Array.from({ length: rows }).map((_, index) => (
                <div key={index} className={styles.skeletonRow}>
                    <div className={styles.skeletonInfo}>
                        <Skeleton width="90px" height="12px" />
                        <Skeleton width="200px" height="18px" />
                        <Skeleton width="240px" height="12px" />
                    </div>

                    <div className={styles.skeletonSide}>
                        <Skeleton width="130px" height="22px" />
                        <Skeleton width="210px" height="40px" />
                    </div>
                </div>
            ))}
        </div>
    );
}
