// app/results/page.jsx (or app/exam-results/page.jsx)
'use client';

import { useState } from 'react';
import styles from '../results/styles/results.module.css';

export default function ExamResults() {
    const [studentNumber, setStudentNumber] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch(
                `http://localhost:3000/grades/view-uncached-results-direct?date_of_birth=${dateOfBirth}&student_number=${studentNumber}`
            );
            const data = await response.json();

            if (data.success) {
                setResults(data.data);
            } else {
                setError('invalid.');
            }
        } catch (err) {
            setError('invalid');
        } finally {
            setLoading(false);
        }
    };

    if (results) {
        return <ResultsDisplay results={results} onBack={() => setResults(null)} />;
    }

    return (
        <div className={styles.container}>

            <div className={styles.searchCard}>
                <div className={styles.brand}>
                    <img
                    src='images.jfif'
                    alt=''
                    style={{
                        width:"100px",
                        height:'100px',
                        borderRadius:'50%'
                    }}/>
                    <div className={styles.brandName}>
                        Malawi National Examinations Board
                    </div>
                    <div className={styles.portal}>
                        Examination Results Portal
                    </div>
                    <div className={styles.how}>
                        *Enter exam number and date of birth to check results*
                    </div>
                </div>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label>Student Number</label>
                        <input
                            type="text"
                            value={studentNumber}
                            onChange={(e) => setStudentNumber(e.target.value)}
                            placeholder="Enter your student number"
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Date of Birth</label>
                        <input
                            type="date"
                            value={dateOfBirth}
                            onChange={(e) => setDateOfBirth(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" disabled={loading} className={styles.button}>
                        {loading ? 'Checking...' : 'View Results'}
                    </button>
                </form>

                {error && <div className={styles.error}>{error}</div>}
            </div>

            <div className={styles.info}>
                <p> Enter your correct student number and date of birth as registered</p>
            </div>
        </div>
    );
}

// Results Display Component
function ResultsDisplay({ results, onBack }) {
    // Define subjects and their grading scales
    const subjects = [
        { name: 'Accounting', key: 'accounting', grade: getGrade(results.accounting) },
        { name: 'Agriculture', key: 'agriculture', grade: getGrade(results.agriculture) },
        { name: 'Bible Knowledge', key: 'bible_knowledge', grade: getGrade(results.bible_knowledge) },
        { name: 'Biology', key: 'biology', grade: getGrade(results.biology) },
        { name: 'Business Studies', key: 'business_studies', grade: getGrade(results.business_studies) },
        { name: 'Chemistry', key: 'chemistry', grade: getGrade(results.chemistry) },
        { name: 'Chichewa', key: 'chichewa', grade: getGrade(results.chichewa) },
        { name: 'Computer Studies', key: 'computer_studies', grade: getGrade(results.computer_studies) },
        { name: 'English', key: 'english', grade: getGrade(results.english) },
        { name: 'Geography', key: 'geography', grade: getGrade(results.geography) },
        { name: 'History', key: 'history', grade: getGrade(results.history) },
        { name: 'Home Economics', key: 'home_economics', grade: getGrade(results.home_economics) },
        { name: 'Mathematics', key: 'mathematics', grade: getGrade(results.mathematics) },
        { name: 'Physics', key: 'physics', grade: getGrade(results.physics) },
        { name: 'Social Studies', key: 'social_studies', grade: getGrade(results.social_studies) },
        { name: 'Technical Drawing', key: 'technical_drawing', grade: getGrade(results.technical_drawing) },
    ];

    // Calculate statistics
    const passedSubjects = subjects.filter(s => parseInt(results[s.key]) >= 50);
    const failedSubjects = subjects.filter(s => parseInt(results[s.key]) < 50 && parseInt(results[s.key]) > 0);
    const notAttempted = subjects.filter(s => results[s.key] === '0' || results[s.key] === null);

    const totalScore = subjects.reduce((sum, s) => sum + (parseInt(results[s.key]) || 0), 0);
    const averageScore = (totalScore / subjects.filter(s => results[s.key] > 0).length).toFixed(1);

    return (
        <div className={styles.resultsContainer}>
            <button onClick={onBack} className={styles.backButton}>← Back to Search</button>

            {/* Student Information */}
            <div className={styles.studentInfo}>
                <h2>Candidate Information</h2>
                <div className={styles.infoGrid}>
                    <div><strong>Name:</strong> {results.first_name} {results.middle_name} {results.last_name}</div>
                    <div><strong>Student Number:</strong> {results.student_number}</div>
                    <div><strong>Date of Birth:</strong> {new Date(results.date_of_birth).toLocaleDateString()}</div>
                    <div><strong>Exam Center:</strong> {results.exam_center.toUpperCase()||""}</div>
                </div>
            </div>



            {/* Results Table */}
            <div className={styles.resultsTable}>
                <h2>Examination Results</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Subject</th>
                            <th>Score</th>
                            <th>Grade</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {subjects.map((subject) => {
                            const score = results[subject.key];
                            if (!score || score === '0') return null;

                            return (
                                <tr key={subject.key} className={parseInt(score) >= 50 ? styles.passRow : styles.failRow}>
                                    <td>{subject.name}</td>
                                    <td>{score}%</td>
                                    <td>{subject.grade}</td>
                                    <td>
                                        <span className={parseInt(score) >= 50 ? styles.passBadge : styles.failBadge}>
                                            {parseInt(score) >= 50 ? 'PASS' : 'FAIL'}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

        </div>
    );
}

// Helper function to get grade based on score
function getGrade(score) {
    const numScore = parseInt(score);
    if (numScore >= 75) return 'A';
    if (numScore >= 65) return 'B';
    if (numScore >= 50) return 'C';
    if (numScore >= 40) return 'D';
    return 'F';
}