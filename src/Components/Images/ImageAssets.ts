import coursesImage from "../../assets/images/users/coursesImage.png";
import freeImage from "../../assets/images/users/freeImage.png";
import parentsImage from "../../assets/images/users/parentsImage.png";
import studentImage from "../../assets/images/users/studentImage.png";

import bggcoursesImage from "../../assets/images/users/bggfreeImage.png";
import bggfreeImage from "../../assets/images/users/bggcoursesImage.png";
import bggparentsImage from "../../assets/images/users/bggparentsImage.png";
import bggstudentImage from "../../assets/images/users/bggstudentImage.png";


import bgcoursesImage from "../../assets/images/users/bgfreeImage.png";
import bgfreeImage from "../../assets/images/users/bgcoursesImage.png";
import bgparentsImage from "../../assets/images/users/bgparentsImage.png";
import bgstudentImage from "../../assets/images/users/bgstudentImage.png";



const UserTypeImages: Record<string, string> = {
    courses: coursesImage,
    free: freeImage,
    parents: parentsImage,
    student: studentImage,

    bggCourses: bggcoursesImage,
    bggFree: bggfreeImage,
    bggParents: bggparentsImage,
    bggStudent: bggstudentImage,

    bgCourses: bgcoursesImage,
    bgFree: bgfreeImage,
    bgParents: bgparentsImage,
    bgStudent: bgstudentImage,
};

export default UserTypeImages;