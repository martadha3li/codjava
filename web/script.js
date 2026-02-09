const state = {
  courses: [],
  appointments: [],
  ui: {
    currentCourseId: null,
    courseSort: { key: 'name', dir: 'asc' }
  }
};

const elements = {
  sectionTitle: document.getElementById('sectionTitle'),
  todayDate: document.getElementById('todayDate'),
  menuItems: document.querySelectorAll('.menu-item'),
  sections: document.querySelectorAll('.section'),
  totalCourses: document.getElementById('totalCourses'),
  totalTrainees: document.getElementById('totalTrainees'),
  todayAppointments: document.getElementById('todayAppointments'),
  todayReminderList: document.getElementById('todayReminderList'),
  courseForm: document.getElementById('courseForm'),
  courseName: document.getElementById('courseName'),
  courseSection: document.getElementById('courseSection'),
  courseNotes: document.getElementById('courseNotes'),
  daysContainer: document.getElementById('daysContainer'),
  addDay: document.getElementById('addDay'),
  coursesTableBody: document.querySelector('#coursesTable tbody'),
  coursesTableHead: document.querySelectorAll('#coursesTable th[data-sort]'),
  courseSearch: document.getElementById('courseSearch'),
  courseDetailTitle: document.getElementById('courseDetailTitle'),
  courseInfo: document.getElementById('courseInfo'),
  traineePaste: document.getElementById('traineePaste'),
  pasteTrainees: document.getElementById('pasteTrainees'),
  traineeForm: document.getElementById('traineeForm'),
  traineeId: document.getElementById('traineeId'),
  traineeName: document.getElementById('traineeName'),
  traineePhone: document.getElementById('traineePhone'),
  traineesTableBody: document.querySelector('#traineesTable tbody'),
  traineeSearchForm: document.getElementById('traineeSearchForm'),
  traineeSearchInput: document.getElementById('traineeSearchInput'),
  traineeSearchResults: document.getElementById('traineeSearchResults'),
  gradeCourseSelect: document.getElementById('gradeCourseSelect'),
  assessmentForm: document.getElementById('assessmentForm'),
  assessmentName: document.getElementById('assessmentName'),
  assessmentMax: document.getElementById('assessmentMax'),
  assessmentList: document.getElementById('assessmentList'),
  gradesTable: document.getElementById('gradesTable'),
  appointmentForm: document.getElementById('appointmentForm'),
  appointmentCourse: document.getElementById('appointmentCourse'),
  appointmentTrainee: document.getElementById('appointmentTrainee'),
  appointmentDate: document.getElementById('appointmentDate'),
  appointmentDay: document.getElementById('appointmentDay'),
  appointmentTime: document.getElementById('appointmentTime'),
  appointmentReason: document.getElementById('appointmentReason'),
  dailyAppointments: document.getElementById('dailyAppointments'),
  closedAppointments: document.getElementById('closedAppointments'),
  exportCourseSelect: document.getElementById('exportCourseSelect'),
  exportButton: document.getElementById('exportButton'),
  modal: document.getElementById('modal'),
  modalTitle: document.getElementById('modalTitle'),
  modalBody: document.getElementById('modalBody'),
  closeModal: document.getElementById('closeModal')
};

const storageKey = 'trainer_management_data_v1';

const formatDate = (date) => date.toLocaleDateString('ar-SA', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

const getTodayString = () => new Date().toISOString().split('T')[0];

const saveState = () => {
  localStorage.setItem(storageKey, JSON.stringify({
    courses: state.courses,
    appointments: state.appointments
  }));
};

const loadState = () => {
  const saved = localStorage.getItem(storageKey);
  if (!saved) return;
  try {
    const parsed = JSON.parse(saved);
    state.courses = parsed.courses || [];
    state.appointments = parsed.appointments || [];
  } catch (error) {
    console.error('تعذر تحميل البيانات', error);
  }
};

const generateId = () => `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

const setSection = (sectionId) => {
  elements.sections.forEach((section) => {
    section.classList.toggle('active', section.id === sectionId);
  });
  elements.menuItems.forEach((item) => {
    item.classList.toggle('active', item.dataset.section === sectionId);
  });
  const activeTitle = document.querySelector(`[data-section="${sectionId}"]`).textContent;
  elements.sectionTitle.textContent = activeTitle;
};

const getCourseById = (courseId) => state.courses.find((course) => course.id === courseId);

const renderDashboard = () => {
  elements.totalCourses.textContent = state.courses.length;
  const totalTrainees = state.courses.reduce((sum, course) => sum + course.trainees.length, 0);
  elements.totalTrainees.textContent = totalTrainees;

  const today = getTodayString();
  const todaysAppointments = state.appointments.filter((appointment) => appointment.date === today && appointment.status === 'open');
  elements.todayAppointments.textContent = todaysAppointments.length;

  elements.todayReminderList.innerHTML = '';
  if (!todaysAppointments.length) {
    elements.todayReminderList.innerHTML = '<div class="list-item"><span>لا توجد مواعيد اليوم.</span></div>';
    return;
  }
  todaysAppointments
    .sort((a, b) => a.time.localeCompare(b.time))
    .forEach((appointment) => {
      const listItem = document.createElement('div');
      listItem.className = 'list-item';
      const timeBadge = getReminderBadge(appointment);
      listItem.innerHTML = `
        <div>
          <strong>${appointment.traineeName}</strong>
          <div><small>${appointment.courseName}</small></div>
        </div>
        <div>
          <span>${appointment.time}</span>
          ${timeBadge}
        </div>
      `;
      elements.todayReminderList.appendChild(listItem);
    });
};

const getReminderBadge = (appointment) => {
  const now = new Date();
  const appointmentTime = new Date(`${appointment.date}T${appointment.time}`);
  const diffMinutes = Math.round((appointmentTime - now) / 60000);
  if (diffMinutes <= 60 && diffMinutes >= 0) {
    return '<span class="badge">تذكير خلال ساعة</span>';
  }
  if (diffMinutes < 0) {
    return '<span class="badge">انتهى الموعد</span>';
  }
  return '';
};

const addDayRow = (day = '', from = '', to = '') => {
  const row = document.createElement('div');
  row.className = 'day-row';
  row.innerHTML = `
    <input type="text" placeholder="اليوم" value="${day}">
    <input type="time" placeholder="من" value="${from}">
    <input type="time" placeholder="إلى" value="${to}">
    <button type="button" class="secondary">حذف</button>
  `;
  row.querySelector('button').addEventListener('click', () => row.remove());
  elements.daysContainer.appendChild(row);
};

const getDayRowsData = () => {
  return Array.from(elements.daysContainer.querySelectorAll('.day-row')).map((row) => {
    const inputs = row.querySelectorAll('input');
    return {
      day: inputs[0].value.trim(),
      from: inputs[1].value,
      to: inputs[2].value
    };
  }).filter((item) => item.day && item.from && item.to);
};

const renderCoursesTable = () => {
  const searchTerm = elements.courseSearch.value.trim().toLowerCase();
  let courses = [...state.courses];

  if (searchTerm) {
    courses = courses.filter((course) => course.name.toLowerCase().includes(searchTerm));
  }

  courses.sort((a, b) => {
    const { key, dir } = state.ui.courseSort;
    let valueA;
    let valueB;
    if (key === 'trainees') {
      valueA = a.trainees.length;
      valueB = b.trainees.length;
    } else {
      valueA = a[key].toString();
      valueB = b[key].toString();
    }
    if (valueA < valueB) return dir === 'asc' ? -1 : 1;
    if (valueA > valueB) return dir === 'asc' ? 1 : -1;
    return 0;
  });

  elements.coursesTableBody.innerHTML = '';
  courses.forEach((course) => {
    const daysText = course.days.map((day) => `${day.day} (${day.from} - ${day.to})`).join('، ');
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${course.name}</td>
      <td>${course.section}</td>
      <td>${daysText || 'غير محدد'}</td>
      <td>${course.trainees.length}</td>
      <td>
        <button class="icon" data-action="open">عرض</button>
        <button class="secondary" data-action="delete">حذف</button>
      </td>
    `;
    row.querySelector('[data-action="open"]').addEventListener('click', () => {
      state.ui.currentCourseId = course.id;
      renderCourseDetail();
      syncCourseSelectors();
      setSection('courses');
    });
    row.querySelector('[data-action="delete"]').addEventListener('click', () => {
      if (!confirm('هل تريد حذف المقرر وجميع بياناته؟')) return;
      state.courses = state.courses.filter((item) => item.id !== course.id);
      if (state.ui.currentCourseId === course.id) {
        state.ui.currentCourseId = null;
      }
      saveState();
      renderAll();
    });
    elements.coursesTableBody.appendChild(row);
  });
};

const renderCourseDetail = () => {
  const course = getCourseById(state.ui.currentCourseId);
  if (!course) {
    elements.courseDetailTitle.textContent = 'اختر مقرراً من القائمة';
    elements.courseInfo.innerHTML = '';
    elements.traineesTableBody.innerHTML = '';
    return;
  }
  elements.courseDetailTitle.textContent = `${course.name} - شعبة ${course.section}`;
  const daysList = course.days.length ? course.days.map((day) => `<li>${day.day} (${day.from} - ${day.to})</li>`).join('') : '<li>غير محدد</li>';
  elements.courseInfo.innerHTML = `
    <strong>المقرر:</strong> ${course.name}<br>
    <strong>الشعبة:</strong> ${course.section}<br>
    <strong>الأيام:</strong>
    <ul>${daysList}</ul>
    <strong>الملاحظات:</strong> ${course.notes || 'لا توجد ملاحظات'}
  `;
  renderTraineesTable(course);
};

const renderTraineesTable = (course) => {
  elements.traineesTableBody.innerHTML = '';
  course.trainees.forEach((trainee) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${trainee.id}</td>
      <td>${trainee.name}</td>
      <td>${trainee.phone || '-'}</td>
      <td>
        <button class="icon" data-action="whatsapp">واتساب</button>
        <button class="icon" data-action="edit">تعديل</button>
        <button class="secondary" data-action="delete">حذف</button>
      </td>
    `;
    row.querySelector('[data-action="delete"]').addEventListener('click', () => {
      course.trainees = course.trainees.filter((item) => item.id !== trainee.id);
      saveState();
      renderAll();
    });
    row.querySelector('[data-action="edit"]').addEventListener('click', () => {
      const newName = prompt('تحديث الاسم الكامل', trainee.name);
      if (!newName) return;
      const newPhone = prompt('تحديث رقم الجوال', trainee.phone || '');
      trainee.name = newName.trim();
      trainee.phone = newPhone ? newPhone.trim() : '';
      saveState();
      renderAll();
    });
    row.querySelector('[data-action="whatsapp"]').addEventListener('click', () => {
      sendWhatsAppMessage(trainee, course, null, 'رسالة عامة من المدرب');
    });
    elements.traineesTableBody.appendChild(row);
  });
};

const addTrainee = (course, trainee) => {
  if (course.trainees.some((item) => item.id === trainee.id)) {
    return false;
  }
  course.trainees.push({
    id: trainee.id,
    name: trainee.name,
    phone: trainee.phone || '',
    scores: {},
    practicalFinal: '',
    theoreticalFinal: ''
  });
  return true;
};

const renderAssessmentList = (course) => {
  elements.assessmentList.innerHTML = '';
  if (!course) return;
  course.assessments.forEach((assessment) => {
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.innerHTML = `${assessment.name} (${assessment.max}) <button data-id="${assessment.id}">×</button>`;
    chip.querySelector('button').addEventListener('click', () => {
      course.assessments = course.assessments.filter((item) => item.id !== assessment.id);
      course.trainees.forEach((trainee) => {
        delete trainee.scores[assessment.id];
      });
      saveState();
      renderGradeTable();
      renderAssessmentList(course);
    });
    elements.assessmentList.appendChild(chip);
  });
};

const calculateTotals = (trainee, course) => {
  const coursework = course.assessments.reduce((sum, assessment) => {
    const score = Number(trainee.scores[assessment.id] || 0);
    return sum + score;
  }, 0);
  const practical = Number(trainee.practicalFinal || 0);
  const theoretical = Number(trainee.theoreticalFinal || 0);
  return {
    coursework,
    practical,
    theoretical,
    total: coursework + practical + theoretical
  };
};

const renderGradeTable = () => {
  const course = getCourseById(elements.gradeCourseSelect.value);
  if (!course) {
    elements.gradesTable.querySelector('thead').innerHTML = '';
    elements.gradesTable.querySelector('tbody').innerHTML = '';
    return;
  }

  const headRow = document.createElement('tr');
  headRow.innerHTML = `
    <th>رقم التدريب</th>
    <th>الاسم</th>
    ${course.assessments.map((assessment) => `<th>${assessment.name}<br><small>${assessment.max}</small></th>`).join('')}
    <th>إجمالي الأعمال</th>
    <th>نهائي عملي</th>
    <th>نهائي نظري</th>
    <th>الإجمالي النهائي</th>
  `;
  const thead = elements.gradesTable.querySelector('thead');
  thead.innerHTML = '';
  thead.appendChild(headRow);

  const tbody = elements.gradesTable.querySelector('tbody');
  tbody.innerHTML = '';

  course.trainees.forEach((trainee) => {
    const totals = calculateTotals(trainee, course);
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${trainee.id}</td>
      <td>${trainee.name}</td>
      ${course.assessments.map((assessment) => {
        const value = trainee.scores[assessment.id] || '';
        return `<td><input type="number" min="0" max="${assessment.max}" data-assessment="${assessment.id}" value="${value}"></td>`;
      }).join('')}
      <td>${totals.coursework}</td>
      <td><input type="number" min="0" data-final="practical" value="${trainee.practicalFinal}"></td>
      <td><input type="number" min="0" data-final="theoretical" value="${trainee.theoreticalFinal}"></td>
      <td class="success">${totals.total}</td>
    `;

    row.querySelectorAll('input[data-assessment]').forEach((input) => {
      input.addEventListener('input', (event) => {
        trainee.scores[event.target.dataset.assessment] = event.target.value;
        saveState();
        renderGradeTable();
      });
    });

    row.querySelectorAll('input[data-final]').forEach((input) => {
      input.addEventListener('input', (event) => {
        trainee[`${event.target.dataset.final}Final`] = event.target.value;
        saveState();
        renderGradeTable();
      });
    });

    tbody.appendChild(row);
  });
};

const syncCourseSelectors = () => {
  const options = state.courses.map((course) => `<option value="${course.id}">${course.name} - شعبة ${course.section}</option>`).join('');
  [elements.gradeCourseSelect, elements.exportCourseSelect, elements.appointmentCourse].forEach((select) => {
    const currentValue = select.value;
    select.innerHTML = options || '<option value="">لا توجد مقررات</option>';
    if (currentValue) {
      select.value = currentValue;
    }
  });
  if (!state.ui.currentCourseId && state.courses.length) {
    state.ui.currentCourseId = state.courses[0].id;
  }
  if (!elements.gradeCourseSelect.value && state.courses.length) {
    elements.gradeCourseSelect.value = state.courses[0].id;
  }
  if (!elements.exportCourseSelect.value && state.courses.length) {
    elements.exportCourseSelect.value = state.courses[0].id;
  }
  if (!elements.appointmentCourse.value && state.courses.length) {
    elements.appointmentCourse.value = state.courses[0].id;
  }
  syncAppointmentTrainees();
  renderAssessmentList(getCourseById(elements.gradeCourseSelect.value));
  renderGradeTable();
};

const syncAppointmentTrainees = () => {
  const course = getCourseById(elements.appointmentCourse.value);
  if (!course) {
    elements.appointmentTrainee.innerHTML = '<option value="">لا يوجد متدربون</option>';
    return;
  }
  elements.appointmentTrainee.innerHTML = course.trainees.map((trainee) => `<option value="${trainee.id}">${trainee.name} (${trainee.id})</option>`).join('');
};

const renderAppointments = () => {
  const today = getTodayString();
  const openAppointments = state.appointments.filter((appointment) => appointment.status === 'open');
  const closedAppointments = state.appointments.filter((appointment) => appointment.status === 'closed');

  elements.dailyAppointments.innerHTML = '';
  const todayList = openAppointments.filter((appointment) => appointment.date === today);
  if (!todayList.length) {
    elements.dailyAppointments.innerHTML = '<div class="list-item">لا توجد مواعيد اليوم.</div>';
  } else {
    todayList.sort((a, b) => a.time.localeCompare(b.time)).forEach((appointment) => {
      const item = createAppointmentItem(appointment, true);
      elements.dailyAppointments.appendChild(item);
    });
  }

  elements.closedAppointments.innerHTML = '';
  if (!closedAppointments.length) {
    elements.closedAppointments.innerHTML = '<div class="list-item">لا توجد مواعيد مغلقة بعد.</div>';
  } else {
    closedAppointments.slice(-6).reverse().forEach((appointment) => {
      const item = createAppointmentItem(appointment, false);
      elements.closedAppointments.appendChild(item);
    });
  }
};

const createAppointmentItem = (appointment, showActions) => {
  const item = document.createElement('div');
  item.className = 'list-item';
  item.innerHTML = `
    <div>
      <strong>${appointment.traineeName}</strong>
      <div><small>${appointment.courseName}</small></div>
      <div><small>${appointment.date} - ${appointment.time} (${appointment.day})</small></div>
      <div><small>${appointment.reason || 'بدون سبب محدد'}</small></div>
    </div>
    <div>
      ${showActions ? '<button class="icon" data-action="done">إغلاق</button>' : '<span class="success">مغلق</span>'}
      <button class="icon" data-action="whatsapp">واتساب</button>
    </div>
  `;
  item.querySelector('[data-action="whatsapp"]').addEventListener('click', () => {
    sendWhatsAppMessage({
      name: appointment.traineeName,
      phone: appointment.traineePhone
    }, { name: appointment.courseName }, appointment, 'تأكيد موعد مراجعة');
  });
  if (showActions) {
    item.querySelector('[data-action="done"]').addEventListener('click', () => {
      appointment.status = 'closed';
      saveState();
      renderAll();
    });
  }
  return item;
};

const renderTraineeSearch = (results) => {
  elements.traineeSearchResults.innerHTML = '';
  if (!results.length) {
    elements.traineeSearchResults.innerHTML = '<div class="list-item">لم يتم العثور على المتدرب.</div>';
    return;
  }
  results.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'list-item';
    row.innerHTML = `
      <div>
        <strong>${item.course.name} - شعبة ${item.course.section}</strong>
        <div><small>المتدرب: ${item.trainee.name}</small></div>
      </div>
      <button class="icon">تفاصيل الدرجات</button>
    `;
    row.querySelector('button').addEventListener('click', () => showGradesModal(item.trainee, item.course));
    elements.traineeSearchResults.appendChild(row);
  });
};

const showGradesModal = (trainee, course) => {
  const totals = calculateTotals(trainee, course);
  elements.modalTitle.textContent = `تفاصيل درجات ${trainee.name}`;
  elements.modalBody.innerHTML = `
    <p><strong>المقرر:</strong> ${course.name} - شعبة ${course.section}</p>
    <table class="data-table">
      <thead>
        <tr>
          <th>التقييم</th>
          <th>الدرجة</th>
          <th>العظمى</th>
        </tr>
      </thead>
      <tbody>
        ${course.assessments.map((assessment) => {
          const score = trainee.scores[assessment.id] || 0;
          return `
            <tr>
              <td>${assessment.name}</td>
              <td>${score}</td>
              <td>${assessment.max}</td>
            </tr>
          `;
        }).join('')}
        <tr>
          <td>إجمالي الأعمال</td>
          <td>${totals.coursework}</td>
          <td>-</td>
        </tr>
        <tr>
          <td>نهائي عملي</td>
          <td>${totals.practical}</td>
          <td>-</td>
        </tr>
        <tr>
          <td>نهائي نظري</td>
          <td>${totals.theoretical}</td>
          <td>-</td>
        </tr>
        <tr>
          <td><strong>الإجمالي النهائي</strong></td>
          <td><strong>${totals.total}</strong></td>
          <td>-</td>
        </tr>
      </tbody>
    </table>
  `;
  elements.modal.classList.add('active');
};

const sendWhatsAppMessage = (trainee, course, appointment, customTitle) => {
  if (!trainee.phone) {
    alert('لا يوجد رقم جوال محفوظ لهذا المتدرب.');
    return;
  }
  const message = [
    customTitle || 'رسالة من المدرب',
    `الاسم: ${trainee.name}`,
    `المقرر: ${course.name}`,
    appointment ? `الموعد: ${appointment.date} - ${appointment.time}` : ''
  ].filter(Boolean).join('\n');
  const encoded = encodeURIComponent(message);
  window.open(`https://wa.me/${trainee.phone}?text=${encoded}`, '_blank');
};

const exportGrades = () => {
  const course = getCourseById(elements.exportCourseSelect.value);
  if (!course) return;
  const headers = [
    'رقم التدريب',
    'اسم المتدرب',
    ...course.assessments.map((assessment) => assessment.name),
    'إجمالي الأعمال',
    'نهائي عملي',
    'نهائي نظري',
    'الإجمالي النهائي'
  ];
  const data = course.trainees.map((trainee) => {
    const totals = calculateTotals(trainee, course);
    return [
      trainee.id,
      trainee.name,
      ...course.assessments.map((assessment) => trainee.scores[assessment.id] || 0),
      totals.coursework,
      totals.practical,
      totals.theoretical,
      totals.total
    ];
  });
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Grades');
  XLSX.writeFile(workbook, `${course.name}-grades.xlsx`);
};

const renderAll = () => {
  renderDashboard();
  renderCoursesTable();
  renderCourseDetail();
  syncCourseSelectors();
  renderAppointments();
};

const setupEventListeners = () => {
  elements.menuItems.forEach((item) => {
    item.addEventListener('click', () => setSection(item.dataset.section));
  });
  document.querySelectorAll('.quick-actions button').forEach((button) => {
    button.addEventListener('click', () => setSection(button.dataset.section));
  });

  elements.addDay.addEventListener('click', () => addDayRow());

  elements.courseForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const days = getDayRowsData();
    if (!days.length) {
      alert('يرجى إضافة يوم ومحاضرة واحدة على الأقل.');
      return;
    }
    const course = {
      id: generateId(),
      name: elements.courseName.value.trim(),
      section: elements.courseSection.value.trim(),
      days,
      notes: elements.courseNotes.value.trim(),
      trainees: [],
      assessments: []
    };
    state.courses.push(course);
    elements.courseForm.reset();
    elements.daysContainer.innerHTML = '';
    addDayRow();
    saveState();
    renderAll();
  });

  elements.courseSearch.addEventListener('input', renderCoursesTable);

  elements.coursesTableHead.forEach((header) => {
    header.addEventListener('click', () => {
      const key = header.dataset.sort;
      if (state.ui.courseSort.key === key) {
        state.ui.courseSort.dir = state.ui.courseSort.dir === 'asc' ? 'desc' : 'asc';
      } else {
        state.ui.courseSort.key = key;
        state.ui.courseSort.dir = 'asc';
      }
      renderCoursesTable();
    });
  });

  elements.pasteTrainees.addEventListener('click', () => {
    const course = getCourseById(state.ui.currentCourseId);
    if (!course) return;
    const lines = elements.traineePaste.value.split('\n').filter(Boolean);
    let added = 0;
    lines.forEach((line) => {
      const [id, name, phone] = line.split(/\t|,/).map((item) => item.trim());
      if (id && name) {
        const success = addTrainee(course, { id, name, phone });
        if (success) added += 1;
      }
    });
    elements.traineePaste.value = '';
    if (!added) {
      alert('لم تتم إضافة متدربين جدد. تأكد من عدم تكرار الأرقام.');
    }
    saveState();
    renderAll();
  });

  elements.traineeForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const course = getCourseById(state.ui.currentCourseId);
    if (!course) return;
    const success = addTrainee(course, {
      id: elements.traineeId.value.trim(),
      name: elements.traineeName.value.trim(),
      phone: elements.traineePhone.value.trim()
    });
    if (!success) {
      alert('رقم المتدرب موجود مسبقاً.');
      return;
    }
    elements.traineeForm.reset();
    saveState();
    renderAll();
  });

  elements.traineeSearchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const searchId = elements.traineeSearchInput.value.trim();
    const results = [];
    state.courses.forEach((course) => {
      const trainee = course.trainees.find((item) => item.id === searchId);
      if (trainee) {
        results.push({ course, trainee });
      }
    });
    renderTraineeSearch(results);
  });

  elements.gradeCourseSelect.addEventListener('change', () => {
    const course = getCourseById(elements.gradeCourseSelect.value);
    renderAssessmentList(course);
    renderGradeTable();
  });

  elements.assessmentForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const course = getCourseById(elements.gradeCourseSelect.value);
    if (!course) return;
    course.assessments.push({
      id: generateId(),
      name: elements.assessmentName.value.trim(),
      max: Number(elements.assessmentMax.value)
    });
    elements.assessmentForm.reset();
    saveState();
    renderAssessmentList(course);
    renderGradeTable();
  });

  elements.appointmentCourse.addEventListener('change', syncAppointmentTrainees);

  elements.appointmentForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const course = getCourseById(elements.appointmentCourse.value);
    if (!course) return;
    const trainee = course.trainees.find((item) => item.id === elements.appointmentTrainee.value);
    if (!trainee) return;
    const date = elements.appointmentDate.value;
    const time = elements.appointmentTime.value;
    const conflict = state.appointments.some((appointment) => appointment.date === date && appointment.time === time && appointment.status === 'open');
    if (conflict) {
      alert('يوجد تعارض في الوقت المطلوب. يرجى اختيار وقت آخر.');
      return;
    }
    const appointment = {
      id: generateId(),
      courseId: course.id,
      courseName: course.name,
      traineeId: trainee.id,
      traineeName: trainee.name,
      traineePhone: trainee.phone,
      date,
      day: elements.appointmentDay.value.trim(),
      time,
      reason: elements.appointmentReason.value.trim(),
      status: 'open'
    };
    state.appointments.push(appointment);
    saveState();
    renderAll();
    sendWhatsAppMessage(trainee, course, appointment, 'تم حجز موعد مراجعة');
    elements.appointmentForm.reset();
  });

  elements.exportButton.addEventListener('click', exportGrades);

  elements.closeModal.addEventListener('click', () => elements.modal.classList.remove('active'));
  elements.modal.addEventListener('click', (event) => {
    if (event.target === elements.modal) {
      elements.modal.classList.remove('active');
    }
  });
};

const init = () => {
  loadState();
  elements.todayDate.textContent = formatDate(new Date());
  addDayRow('الأحد', '08:00', '10:00');
  setupEventListeners();
  renderAll();
};

init();
