// Link Google Sheet công khai định dạng CSV của Nhà Chờ Phục Sinh
const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQDqsKXut4tys4GoS-D19eQ_hthJIhLXxX8a6_neYoavoIOpbMgnHPOH8wlvSO-N783DrjUZfWRCPYc/pub?gid=1625617362&single=true&output=csv';

let allData = [];
let selectedDate = new Date(); // Mặc định ngày hôm nay

window.addEventListener('DOMContentLoaded', () => {
  Papa.parse(csvUrl, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function(results) {
      allData = results.data;
      document.getElementById('loading').style.display = 'none';
      
      // Tính toán và hiển thị số lượng giỗ hôm nay lên Badge tab
      updateBadgeCount(allData);
      
      // Hiển thị danh sách giỗ theo ngày hiện tại
      updateAnniversaryView();
      
      // Giao diện tab Tìm kiếm ban đầu
      document.getElementById('resultsGrid').innerHTML = '<p class="search-hint">Nhập tên, tên thánh, năm mất hoặc mã số để tìm vị trí hài cốt thân nhân.</p>';
      document.getElementById('recordCount').innerText = `Danh sách có ${allData.length} người`;
    },
    error: function(err) {
      document.getElementById('loading').innerHTML = '<span style="color: red;">Không thể tải dữ liệu từ Google Sheets. Vui lòng kiểm tra lại liên kết!</span>';
    }
  });
});

// Chuyển đổi qua lại giữa các Tab (Search, Anniversary, Gallery)
function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

  if (tabName === 'search') {
    document.getElementById('tabSearch').classList.add('active');
    document.getElementById('tabBtnSearch').classList.add('active');
  } else if (tabName === 'anniversary') {
    document.getElementById('tabAnniversary').classList.add('active');
    document.getElementById('tabBtnAnniversary').classList.add('active');
  } else if (tabName === 'gallery') {
    document.getElementById('tabGallery').classList.add('active');
    document.getElementById('tabBtnGallery').classList.add('active');
  }
}

// Hàm hỗ trợ bỏ dấu tiếng Việt để tìm kiếm
function removeAccents(str) {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

// Đếm và cập nhật số lượng giỗ hôm nay lên huy hiệu trên Tab
function updateBadgeCount(data) {
  const todayStr = getFormattedDateStr(new Date());
  const count = data.filter(item => {
    const gio = item['ngayGioDuong'] ? item['ngayGioDuong'].trim() : '';
    return gio && (gio === todayStr || gio.startsWith(todayStr + '/'));
  }).length;
  
  const badge = document.getElementById('badgeCount');
  if (badge) badge.innerText = count;
}

function getFormattedDateStr(dateObj) {
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

// Chuyển ngày qua lại bằng nút mũi tên
function changeDate(days) {
  selectedDate.setDate(selectedDate.getDate() + days);
  updateAnniversaryView();
}

// Khi chọn ngày từ lịch
function onDateSelected(dateString) {
  if (!dateString) return;
  const parts = dateString.split('-');
  selectedDate = new Date(parts[0], parts[1] - 1, parts[2]);
  updateAnniversaryView();
}

// Cập nhật giao diện danh sách giỗ theo ngày chọn
function updateAnniversaryView() {
  const dayStr = String(selectedDate.getDate()).padStart(2, '0');
  const monthStr = String(selectedDate.getMonth() + 1).padStart(2, '0');
  const yearStr = selectedDate.getFullYear();
  
  const targetDdMm = `${dayStr}/${monthStr}`;

  const dateInput = document.getElementById('datePickerInput');
  if (dateInput) {
    dateInput.value = `${yearStr}-${monthStr}-${dayStr}`;
  }

  const todayCheck = new Date();
  const isToday = selectedDate.toDateString() === todayCheck.toDateString();
  
  const titleMain = document.getElementById('dateTitleMain');
  const titleSub = document.getElementById('dateTitleSub');
  
  if (titleMain) titleMain.innerText = isToday ? "Hôm nay" : "Ngày giỗ";
  
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  if (titleSub) titleSub.innerText = selectedDate.toLocaleDateString('vi-VN', options);

  displayAnniversaryByDate(targetDdMm, yearStr);
}

// Hiển thị danh sách giỗ tương ứng ngày
function displayAnniversaryByDate(ddMmStr, currentYear) {
  const container = document.getElementById('todayAnniversaryList');
  const countHeader = document.getElementById('anniversaryCountHeader');
  
  if (!container || !countHeader) return;

  const matchedList = allData.filter(item => {
    const gio = item['ngayGioDuong'] ? item['ngayGioDuong'].trim() : '';
    return gio && (gio === ddMmStr || gio.startsWith(ddMmStr + '/'));
  });

  countHeader.innerText = `${matchedList.length} linh hồn có ngày giỗ trong ngày`;

  if (matchedList.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem; font-style: italic;">Không có thông tin giỗ trong ngày này.</p>';
    return;
  }

  container.innerHTML = '';

  matchedList.forEach(item => {
    const tenThanh = item['tenThanh'] || '';
    const hoTen = item['hoTen'] || '';
    const ngaySinh = item['ngaySinh'] || '';
    const ngayMat = item['ngayMat'] || '';
    const khu = item['khu'] || '';
    const day = item['day'] || '';
    const soHoc = item['soHoc'] || '';

    // Tính giỗ năm thứ mấy
    let anniversaryYearsText = '';
    if (ngayMat) {
      const parts = ngayMat.split('/');
      const deathYear = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(deathYear) && deathYear <= currentYear) {
        const diff = currentYear - deathYear;
        const yearsCount = diff === 0 ? 1 : diff;
        anniversaryYearsText = `<div class="anniversary-badge">Giỗ năm thứ ${yearsCount}</div>`;
      }
    }

    let locationParts = [];
    if (khu) locationParts.push(`Lô ${khu}`);
    if (day) locationParts.push(`Tầng ${day}`);
    if (soHoc) locationParts.push(`Ngăn ${soHoc}`);
    const locationText = locationParts.join(' - ') || 'Chưa định vị';

    let lifeSpanText = '';
    if (ngaySinh || ngayMat) {
      lifeSpanText = `Sinh ${ngaySinh || '?'} ✝ Mất ${ngayMat || '?'}`;
    }

    const card = document.createElement('div');
    card.className = 'today-card';
    card.innerHTML = `
      <div class="today-info">
        <div class="saint-name">${tenThanh}</div>
        <div class="full-name">${hoTen}</div>
        ${lifeSpanText ? `<div class="today-lifespan">${lifeSpanText}</div>` : ''}
        ${anniversaryYearsText}
      </div>
      <div class="today-loc-box">
        <div class="loc-label">MÃ SỐ - VỊ TRÍ HÀI CỐT</div>
        <div class="loc-value">${locationText}</div>
      </div>
      <div class="prayer-actions">
        <button class="action-btn" onclick="triggerAction(this, '🕯️ Đã tưởng niệm')">🕯️ Tưởng niệm</button>
        <button class="action-btn" onclick="triggerAction(this, '🌸 Đã tri ân')">🌸 Tri ân</button>
        <button class="action-btn" onclick="triggerAction(this, '❤️ Đã thương nhớ')">❤️ Thương nhớ</button>
        <button class="action-btn" onclick="triggerAction(this, '🙏 Đã cầu nguyện')">🙏 Cầu nguyện</button>
      </div>
    `;
    container.appendChild(card);
  });
}

// Hiệu ứng nút tương tác
function triggerAction(btn, message) {
  const originalText = btn.innerText;
  btn.innerText = message;
  btn.style.backgroundColor = '#8B0000';
  btn.style.color = '#FFF8E7';
  setTimeout(() => {
    btn.innerText = originalText;
    btn.style.backgroundColor = '';
    btn.style.color = '';
  }, 2500);
}

// Hiển thị kết quả tra cứu ở tab Tìm kiếm
function displayData(data) {
  const grid = document.getElementById('resultsGrid');
  const countEl = document.getElementById('recordCount');
  grid.innerHTML = '';

  countEl.innerText = `Tìm thấy ${data.length} kết quả`;

  if (data.length === 0) {
    grid.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem; grid-column: 1/-1;">Không tìm thấy thông tin phù hợp.</p>';
    return;
  }

  data.forEach(item => {
    const tenThanh = item['tenThanh'] || '';
    const hoTen = item['hoTen'] || '';
    const ngaySinh = item['ngaySinh'] || '';
    const ngayMat = item['ngayMat'] || '';
    const ngayGioDuong = item['ngayGioDuong'] || '';
    const khu = item['khu'] || '';
    const day = item['day'] || '';
    const soHoc = item['soHoc'] || '';
    const ghichu = item['ghichu'] || '';

    let locationParts = [];
    if (khu) locationParts.push(`Lô ${khu}`);
    if (day) locationParts.push(`Tầng ${day}`);
    if (soHoc) locationParts.push(`Ngăn ${soHoc}`);
    const locationText = locationParts.join(' - ') || 'Chưa định vị';

    let lifeSpanText = '';
    if (ngaySinh || ngayMat) {
      lifeSpanText = `Sinh ${ngaySinh || '?'} ✝ Mất ${ngayMat || '?'}`;
    }

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-info">
        <div class="saint-name">${tenThanh}</div>
        <div class="full-name">${hoTen}</div>
        <div class="card-details">
          ${lifeSpanText ? `<span>${lifeSpanText}</span>` : ''}
          ${ngayGioDuong ? `<span>🕯️ Ngày giỗ: <strong>${ngayGioDuong}</strong></span>` : ''}
          ${ghichu ? `<span style="width: 100%; font-style: italic; color: var(--text-muted);">📝 Ghi chú: ${ghichu}</span>` : ''}
        </div>
      </div>
      <div class="location-badge">
        📍 Vị trí<br>${locationText}
      </div>
    `;
    grid.appendChild(card);
  });
}

// Bộ lọc tìm kiếm
function filterData() {
  const rawQuery = document.getElementById('searchInput').value.trim();
  const query = removeAccents(rawQuery.toLowerCase());
  const grid = document.getElementById('resultsGrid');
  
  if (!query) {
    grid.innerHTML = '<p class="search-hint">Nhập tên, tên thánh, năm mất hoặc mã số để tìm vị trí hài cốt thân nhân.</p>';
    document.getElementById('recordCount').innerText = `Danh sách có ${allData.length} người`;
    return;
  }

  const filtered = allData.filter(item => {
    return Object.values(item).some(val => {
      if (!val) return false;
      const strVal = String(val);
      return strVal.toLowerCase().includes(rawQuery.toLowerCase()) || 
             removeAccents(strVal.toLowerCase()).includes(query);
    });
  });

  displayData(filtered);
}

// Xóa tìm kiếm
function clearSearch() {
  document.getElementById('searchInput').value = '';
  document.getElementById('resultsGrid').innerHTML = '<p class="search-hint">Nhập tên, tên thánh, năm mất hoặc mã số để tìm vị trí hài cốt thân nhân.</p>';
  document.getElementById('recordCount').innerText = `Danh sách có ${allData.length} người`;
}
