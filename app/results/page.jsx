'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './styles/results.module.css';

export default function ExamResults() {
    const [studentNumber, setStudentNumber] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [queueInfo, setQueueInfo] = useState(null);

    const abortRef = useRef(false);

    useEffect(() => {
        return () => {
            abortRef.current = true;
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);
        setError('');
        setResults(null);
        setQueueInfo(null);
        abortRef.current = false;

        try {
            const url = new URL(
                'http://localhost:3000/grades/view-uncached-results'
            );

            url.searchParams.append('date_of_birth', dateOfBirth);
            url.searchParams.append('student_number', studentNumber);

            const response = await fetch(url);
            const data = await response.json();

            if (!response.ok) {
                setError('Server error');
                return;
            }

            console.log(response)
            if (response.status === 202 && data?.data?.jobId) {
                const { jobId, position, estimatedWaitTime } = data.data;

                setQueueInfo({
                    jobId,
                    position,
                    estimatedWaitTime,
                    progress: 0,
                });

                await pollJob(jobId);
                return;
            }

            setError('Unexpected response from server');
        } catch (err) {
            setError('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const pollJob = async (jobId) => {
        let attempts = 0;

        while (attempts < 30) {
            if (abortRef.current) return;

            try {
                const res = await fetch(
                    `http://localhost:3000/grades/queue/status/${jobId}`
                );

                const data = await res.json();

                if (abortRef.current) return;

                // update progress if available
                if (data.progress !== undefined) {
                    setQueueInfo((prev) => ({
                        ...prev,
                        progress: data.progress,
                    }));
                }

                if (data.status === 'completed') {
                    setResults(data.result?.data || null);
                    setQueueInfo(null);
                    return;
                }

                if (data.status === 'failed') {
                    setError('Processing failed');
                    setQueueInfo(null);
                    return;
                }

                await new Promise((r) => setTimeout(r, 2000));
                attempts++;
            } catch (err) {
                setError('Error checking status');
                return;
            }
        }

        setError('Took too long. Try again.');
    };

    if (results) {
        return (
            <ResultsDisplay
                results={results}
                onBack={() => setResults(null)}
            />
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.searchCard}>
                <div className={styles.brand}>
                    <img
                        src="images.jfif"
                        alt=""
                        style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                        }}
                    />

                    <div className={styles.brandName}>
                        Malawi National Examinations Board
                    </div>

                    <div className={styles.portal}>
                        Examination Results Portal
                    </div>

                    <div className={styles.how}>
                        *Enter exam number and date of birth*
                    </div>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label>Student Number</label>
                        <input
                            type="text"
                            value={studentNumber}
                            onChange={(e) =>
                                setStudentNumber(e.target.value)
                            }
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Date of Birth</label>
                        <input
                            type="date"
                            value={dateOfBirth}
                            onChange={(e) =>
                                setDateOfBirth(e.target.value)
                            }
                            required
                        />
                    </div>

                    <button
                        disabled={loading}
                        className={styles.button}
                    >
                        {loading ? 'Processing...' : 'View Results'}
                    </button>
                </form>

                {queueInfo && (
                    <div className={styles.info}>
                        <p>Your request is in queue</p>
                        <p>Position: {queueInfo.position}</p>
                        <p>
                            Estimated wait:{' '}
                            {queueInfo.estimatedWaitTime}s
                        </p>
                        <p>Progress: {queueInfo.progress ?? 0}%</p>
                    </div>
                )}

                {error && (
                    <div className={styles.error}>{error}</div>
                )}
            </div>
        </div>
    );
}

// ================= RESULT DISPLAY =================

function ResultsDisplay({ results, onBack }) {
    const subjects = [
        { name: 'Mathematics', key: 'mathematics' },
        { name: 'English', key: 'english' },
        { name: 'Biology', key: 'biology' },
        { name: 'Physics', key: 'physics' },
        { name: 'Chemistry', key: 'chemistry' },
        { name: 'Chichewa', key: 'chichewa' },
        { name: 'Social Studies', key: 'social_studies' },
        { name: 'History', key: 'history' },
    ];

    return (
        <div className={styles.resultsContainer}>
            <button onClick={onBack} className={styles.backButton}>Back to Search</button>

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

// ================= HELPERS =================

function getGrade(score) {
    if (score >= 75) return 'A';
    if (score >= 65) return 'B';
    if (score >= 50) return 'C';
    if (score >= 40) return 'D';
    return 'F';
}