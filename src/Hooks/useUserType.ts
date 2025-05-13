import { useState, useEffect } from 'react';

type UserType = "admin" | "parent" | "student" | "teacher" | 'notFound' | null;

const useUserType = (): UserType => {
    const [userType, setUserType] = useState<UserType>('parent');

    useEffect(() => {
        const storedUserType = localStorage.getItem('userType');

        if (
            storedUserType === 'admin' ||
            storedUserType === 'parent' ||
            storedUserType === 'student' ||
            storedUserType === 'teacher'
        ) {
            setUserType(storedUserType);
        } else {
            setUserType('notFound');
        }
    }, []);

    return userType;
};

export default useUserType;