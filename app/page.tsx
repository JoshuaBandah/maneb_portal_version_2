import Image from "next/image";
import styles from "./page.module.css";
import ExamResults from './results/page';
export default function Home() {
  return (
    <div>
      <ExamResults/>
    </div>
  );
}
