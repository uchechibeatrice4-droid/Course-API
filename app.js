const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware: allows Express to read JSON request bodies.
app.use(express.json());

// Location of our JSON data file.
const filePath = path.join(__dirname, 'data', 'courses.json');

// Read courses from the JSON file.
function readCourses() {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
}

// Save courses permanently to the JSON file.
function writeCourses(courses) {
    fs.writeFileSync(
        filePath,
        JSON.stringify(courses, null, 2),
        'utf8'
    );
}

// Check that all required course fields are provided.
function hasCourseFields(course) {
    return (
        course.title !== undefined &&
        typeof course.title === 'string' &&
        course.title.trim() !== '' &&
        course.instructor !== undefined &&
        typeof course.instructor === 'string' &&
        course.instructor.trim() !== '' &&
        course.duration !== undefined &&
        typeof course.duration === 'string' &&
        course.duration.trim() !== '' &&
        course.price !== undefined &&
        typeof course.price === 'number' &&
        Number.isFinite(course.price) &&
        course.price >= 0
    );
}

// 1. GET /courses - Retrieve all courses.
app.get('/courses', (req, res) => {
    const courses = readCourses();
    res.status(200).json(courses);
});

// 2. GET /courses/:id - Retrieve one course.
app.get('/courses/:id', (req, res) => {
    const courses = readCourses();

    const course = courses.find(
        (item) => String(item.id) === req.params.id
    );

    if (!course) {
        return res.status(404).json({
            message: 'Course not found'
        });
    }

    res.status(200).json(course);
});

// 3. POST /courses - Create a new course.
app.post('/courses', (req, res) => {
    const courses = readCourses();
    const newCourse = req.body;

    if (!hasCourseFields(newCourse)) {
        return res.status(400).json({
            message: 'Provide a title, instructor, duration, and a valid price'
        });
    }

    // Generate the next numeric ID.
    const nextId = courses.reduce(
        (maxId, course) => Math.max(maxId, Number(course.id) || 0),
        0
    ) + 1;

    const course = {
        id: nextId,
        title: newCourse.title.trim(),
        instructor: newCourse.instructor.trim(),
        duration: newCourse.duration.trim(),
        price: newCourse.price
    };

    courses.push(course);
    writeCourses(courses);

    res.status(201).json({
        message: 'Course created successfully',
        course
    });
});

// 4. PUT /courses/:id - Replace an existing course.
app.put('/courses/:id', (req, res) => {
    const courses = readCourses();

    const index = courses.findIndex(
        (item) => String(item.id) === req.params.id
    );

    if (index === -1) {
        return res.status(404).json({
            message: 'Course not found'
        });
    }

    if (!hasCourseFields(req.body)) {
        return res.status(400).json({
            message: 'Provide a title, instructor, duration, and a valid price'
        });
    }

    // Replace the course details while keeping its original ID.
    const updatedCourse = {
        id: courses[index].id,
        title: req.body.title.trim(),
        instructor: req.body.instructor.trim(),
        duration: req.body.duration.trim(),
        price: req.body.price
    };

    courses[index] = updatedCourse;
    writeCourses(courses);

    res.status(200).json({
        message: 'Course replaced successfully',
        course: updatedCourse
    });
});

// 5. PATCH /courses/:id - Update selected fields only.
app.patch('/courses/:id', (req, res) => {
    const courses = readCourses();

    const index = courses.findIndex(
        (item) => String(item.id) === req.params.id
    );

    if (index === -1) {
        return res.status(404).json({
            message: 'Course not found'
        });
    }

    const updates = req.body;
    const allowedFields = [
        'title',
        'instructor',
        'duration',
        'price'
    ];

    const suppliedFields = Object.keys(updates);

    if (suppliedFields.length === 0) {
        return res.status(400).json({
            message: 'Provide at least one field to update'
        });
    }

    // Reject unknown fields and attempts to change the ID.
    if (suppliedFields.some(
        (field) => !allowedFields.includes(field)
    )) {
        return res.status(400).json({
            message: 'Only title, instructor, duration, and price can be updated'
        });
    }

    const updatedCourse = {
        ...courses[index],
        ...updates
    };

    if (!hasCourseFields(updatedCourse)) {
        return res.status(400).json({
            message: 'Course fields must be valid'
        });
    }

    updatedCourse.title = updatedCourse.title.trim();
    updatedCourse.instructor = updatedCourse.instructor.trim();
    updatedCourse.duration = updatedCourse.duration.trim();

    courses[index] = updatedCourse;
    writeCourses(courses);

    res.status(200).json({
        message: 'Course updated successfully',
        course: updatedCourse
    });
});

// 6. DELETE /courses/:id - Delete a course.
app.delete('/courses/:id', (req, res) => {
    const courses = readCourses();

    const index = courses.findIndex(
        (item) => String(item.id) === req.params.id
    );

    if (index === -1) {
        return res.status(404).json({
            message: 'Course not found'
        });
    }

    const deletedCourse = courses.splice(index, 1)[0];

    writeCourses(courses);

    res.status(200).json({
        message: 'Course deleted successfully',
        course: deletedCourse
    });
});

// Start the server.
app.listen(PORT, () => {
    console.log(`Course API running at http://localhost:${PORT}`);
});