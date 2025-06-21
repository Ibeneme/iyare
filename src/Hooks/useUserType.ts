import { useState, useEffect } from 'react';

type UserType = "admin" | "parent" | "student" | "teacher" | "grade" | "notFound" | "department" | "course" | null;

const useUserType = (): UserType => {
    const [userType, setUserType] = useState<UserType>('parent');

    useEffect(() => {
        const storedUserType = localStorage.getItem('userType');

        if (
            storedUserType === 'admin' ||
            storedUserType === 'parent' ||
            storedUserType === 'student' ||
            storedUserType === 'teacher' ||
            storedUserType === 'grade'
        ) {
            setUserType(storedUserType);
        } else {
            setUserType('notFound');
        }
    }, []);

    return userType;
};

export default useUserType;