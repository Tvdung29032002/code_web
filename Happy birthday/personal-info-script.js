document.addEventListener("DOMContentLoaded", function () {
  let currentUsername = "";
  let personalInfo = {
    name: "",
    birthday: "",
    gender: "",
    email: "",
    phone: "",
    bio: "",
    photoUrl: "album/avatar.jpg",
  };

  const editButton = document.getElementById("edit-button");
  const saveButton = document.getElementById("save-button");
  const cancelButton = document.getElementById("cancel-button");
  const editableFields = document.querySelectorAll('.info-value[id^="user-"]');
  const profilePhoto = document.getElementById("profile-photo");
  const photoUpload = document.getElementById("photo-upload");
  const changePhotoButton = document.getElementById("change-photo-button");
  const bioTextarea = document.getElementById("user-bio");
  const bioCharCount = document.getElementById("bio-char-count");
  const genderSpan = document.getElementById("user-gender");
  const genderSelect = document.getElementById("gender-select");
  const birthdaySpan = document.getElementById("user-birthday");
  const birthdayPicker = document.getElementById("birthday-picker");

  function getCurrentUsername() {
    return localStorage.getItem("username") || "";
  }

  function savePersonalInfo(info) {
    localStorage.setItem(
      `personalInfo_${currentUsername}`,
      JSON.stringify(info)
    );
    // Đánh dấu rằng thông tin cá nhân đã được cập nhật
    localStorage.setItem(`profileUpdated_${currentUsername}`, "true");
  }

  function getPersonalInfo() {
    const storedInfo = localStorage.getItem(`personalInfo_${currentUsername}`);
    return storedInfo ? JSON.parse(storedInfo) : null;
  }

  function isProfileUpdated() {
    return localStorage.getItem(`profileUpdated_${currentUsername}`) === "true";
  }

  function updateInfoDisplay() {
    const info = getPersonalInfo();
    if (info && isProfileUpdated()) {
      document.getElementById("user-name").textContent = info.name;
      birthdaySpan.textContent = formatDate(info.birthday);
      birthdayPicker.value = info.birthday;
      genderSpan.textContent = info.gender;
      genderSelect.value = info.gender;
      document.getElementById("user-email").textContent = info.email;
      document.getElementById("user-phone").textContent = info.phone;
      bioTextarea.value = info.bio;
      updateCharCount();

      if (info.photoUrl) {
        profilePhoto.src = info.photoUrl;
      }
    } else {
      // Hiển thị thông báo yêu cầu cập nhật thông tin
      alert("Vui lòng cập nhật thông tin cá nhân của bạn.");
    }
  }

  function updateCharCount() {
    const currentLength = bioTextarea.value.length;
    bioCharCount.textContent = currentLength;
  }

  function toggleEditMode(editable) {
    editableFields.forEach((field) => {
      if (field.id !== "user-gender" && field.id !== "user-birthday") {
        field.contentEditable = editable;
        field.classList.toggle("editable", editable);
      }
    });
    genderSpan.style.display = editable ? "none" : "inline";
    genderSelect.style.display = editable ? "inline" : "none";
    birthdaySpan.style.display = editable ? "none" : "inline";
    birthdayPicker.style.display = editable ? "inline" : "none";
    bioTextarea.readOnly = !editable;
    editButton.style.display = editable ? "none" : "inline-block";
    saveButton.style.display = editable ? "inline-block" : "none";
    cancelButton.style.display = editable ? "inline-block" : "none";
  }

  function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day} tháng ${month}, ${year}`;
  }

  function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  function validatePhone(phone) {
    const regex = /^\d{10}$/;
    return regex.test(phone);
  }

  function showErrorPopup(message) {
    const errorPopup = document.getElementById("error-popup");
    const errorMessage = document.getElementById("error-message");
    errorMessage.textContent = message;
    errorPopup.style.display = "block";
  }

  function hideErrorPopup() {
    const errorPopup = document.getElementById("error-popup");
    errorPopup.style.display = "none";
  }

  currentUsername = getCurrentUsername();
  if (currentUsername) {
    if (!isProfileUpdated()) {
      alert("Vui lòng cập nhật thông tin cá nhân của bạn.");
      toggleEditMode(true); // Tự động chuyển sang chế độ chỉnh sửa
    } else {
      updateInfoDisplay();
    }
  } else {
    console.log("User not logged in");
    window.location.href = "login.html";
  }

  editButton.addEventListener("click", function () {
    toggleEditMode(true);
  });

  saveButton.addEventListener("click", function () {
    const newName = document.getElementById("user-name").textContent.trim();
    const newEmail = document.getElementById("user-email").textContent.trim();
    const newPhone = document.getElementById("user-phone").textContent.trim();
    const newBirthday = birthdayPicker.value.trim();
    const newGender = genderSelect.value;
    const newBio = bioTextarea.value.trim();

    let errorMessage = "";

    if (!newName) {
      errorMessage = "Vui lòng nhập họ tên.";
    } else if (!newEmail) {
      errorMessage = "Vui lòng nhập địa chỉ email.";
    } else if (!validateEmail(newEmail)) {
      errorMessage = 'Email không hợp lệ. Vui lòng nhập email có chứa "@".';
    } else if (!newPhone) {
      errorMessage = "Vui lòng nhập số điện thoại.";
    } else if (!validatePhone(newPhone)) {
      errorMessage = "Số điện thoại không hợp lệ. Vui lòng nhập 10 chữ số.";
    } else if (!newBirthday) {
      errorMessage = "Vui lòng chọn ngày sinh.";
    } else if (!newGender) {
      errorMessage = "Vui lòng chọn giới tính.";
    }

    if (errorMessage) {
      showErrorPopup(errorMessage);
      return;
    }

    const updatedInfo = {
      name: newName,
      birthday: newBirthday,
      gender: newGender,
      email: newEmail,
      phone: newPhone,
      bio: newBio,
      photoUrl: personalInfo.photoUrl,
    };

    savePersonalInfo(updatedInfo);
    updateInfoDisplay();
    toggleEditMode(false);
  });

  cancelButton.addEventListener("click", function () {
    updateInfoDisplay();
    toggleEditMode(false);
  });

  changePhotoButton.addEventListener("click", function () {
    photoUpload.click();
  });

  photoUpload.addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        profilePhoto.src = e.target.result;
        personalInfo.photoUrl = e.target.result;
        savePersonalInfo(personalInfo);
      };
      reader.readAsDataURL(file);
    }
  });

  bioTextarea.addEventListener("input", updateCharCount);

  document.getElementById("back-button").addEventListener("click", function () {
    window.history.back();
  });

  document
    .getElementById("error-ok-button")
    .addEventListener("click", hideErrorPopup);

  flatpickr("#birthday-picker", {
    dateFormat: "Y-m-d",
    maxDate: "today",
    locale: {
      firstDayOfWeek: 1,
      weekdays: {
        shorthand: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
        longhand: [
          "Chủ Nhật",
          "Thứ Hai",
          "Thứ Ba",
          "Thứ Tư",
          "Thứ Năm",
          "Thứ Sáu",
          "Thứ Bảy",
        ],
      },
      months: {
        shorthand: [
          "Th1",
          "Th2",
          "Th3",
          "Th4",
          "Th5",
          "Th6",
          "Th7",
          "Th8",
          "Th9",
          "Th10",
          "Th11",
          "Th12",
        ],
        longhand: [
          "Tháng 1",
          "Tháng 2",
          "Tháng 3",
          "Tháng 4",
          "Tháng 5",
          "Tháng 6",
          "Tháng 7",
          "Tháng 8",
          "Tháng 9",
          "Tháng 10",
          "Tháng 11",
          "Tháng 12",
        ],
      },
    },
  });

  const logoutButton = document.getElementById("logout-button");
  logoutButton.addEventListener("click", function () {
    localStorage.removeItem("username");
    localStorage.removeItem("isLoggedIn");
    window.location.href = "login.html";
  });
});
