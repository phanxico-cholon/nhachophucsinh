// Link Google Sheet công khai định dạng CSV của Nhà Chờ Phục Sinh
const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQDqsKXut4tys4GoS-D19eQ_hthJIhLXxX8a6_neYoavoIOpbMgnHPOH8wlvSO-N783DrjUZfWRCPYc/pub?gid=1625617362&single=true&output=csv';

let allData = [];
let selectedDate = new Date(); // Mặc định là ngày hôm nay

window.addEventListener('DOMContentLoaded', () => {
  Papa.parse(csvUrl, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function(results) {
      allData = results.data;
      document.getElementById('loading').style.display = 'none';
      
      // Hiển thị danh sách giỗ theo ngày hiện tại
      updateAnniversaryView();
      
      // Mới vào: không hiển thị danh sách tìm kiếm
      document.getElementById('resultsGrid').innerHTML = '<p class="search-hint">Vui lòng nhập thông tin vào ô tìm kiếm ở trên để tra cứu vị trí hài cốt thân nhân.</p>';
      document.getElementById('recordCount').innerText = 'Sẵn sàng tra cứu';
    },
    error: function(err) {
      document.getElementById('loading').innerHTML = '<span style="color: red;">Không thể tải dữ liệu từ Nhà chờ Phục Sinh. Vui lòng kiểm tra lại liên kết!</span>';
    }
  });
});

// Hàm hỗ trợ bỏ dấu tiếng Việt để tìm kiếm
function removeAccents(str) {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

// Chuyển ngày qua lại bằng nút mũi tên (< hoặc >)
function changeDate(days) {
  selectedDate.setDate(selectedDate.getDate() + days);
  updateAnniversaryView();
}

// Khi người dùng chọn ngày từ ô lịch
function onDateSelected(dateString) {
  if (!dateString) return;
  const parts = dateString.split('-');
  selectedDate = new Date(parts[0], parts[1] - 1, parts[2]);
  updateAnniversaryView();
}

// Cập nhật hiển thị giao diện danh sách giỗ theo ngày đang chọn
function updateAnniversaryView() {
  const dayStr = String(selectedDate.getDate()).padStart(2, '0');
  const monthStr = String(selectedDate.getMonth() + 1).padStart(2, '0');
  const yearStr = selectedDate.getFullYear();
  
  const targetDdMm = `${dayStr}/${monthStr}`;

  // Đồng bộ giá trị cho input date
  const dateInput = document.getElementById('datePickerInput');
  if (dateInput) {
    dateInput.value = `${yearStr}-${monthStr}-${dayStr}`;
  }

  // Cập nhật tiêu đề ngày tháng
  const todayCheck = new Date();
  const isToday = selectedDate.toDateString() === todayCheck.toDateString();
  
  const titleMain = document.getElementById('dateTitleMain');
  const titleSub = document.getElementById('dateTitleSub');
  
  if (titleMain) titleMain.innerText = isToday ? "Hôm nay" : "Ngày giỗ";
  
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  if (titleSub) titleSub.innerText = selectedDate.toLocaleDateString('vi-VN', options);

  displayAnniversaryByDate(targetDdMm, yearStr);
}

// Lọc và hiển thị danh sách linh hồn có ngày giỗ khớp
function displayAnniversaryByDate(ddMmStr, currentYear) {
  const container = document.getElementById('todayAnniversaryList');
  const countHeader = document.getElementById('anniversaryCountHeader');
  
  if (!container || !countHeader) return;

  // Lọc theo ngayGioDuong (hỗ trợ định dạng dd/mm hoặc dd/mm/yyyy)
  const matchedList = allData.filter(item => {
    const gio = item['ngayGioDuong'] ? item['ngayGioDuong'].trim() : '';
    return gio && (gio === ddMmStr || gio.startsWith(ddMmStr + '/'));
  });

  countHeader.innerText = `${matchedList.length} linh hồn có ngày giỗ trong ngày này`;

  if (matchedList.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 1.5rem; grid-column: 1/-1; font-style: italic;">Không có thông tin giỗ trong ngày này.</p>';
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

    // Tính giỗ năm thứ mấy dựa trên năm mất (lấy 4 ký tự cuối của ngayMat hoặc cột năm mất nếu có)
    let anniversaryYearsText = '';
    if (ngayMat) {
      const parts = ngayMat.split('/');
      const deathYear = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(deathYear) && deathYear <= currentYear) {
        const diff = currentYear - deathYear;
        const yearsCount = diff === 0 ? 1 : diff; // năm đầu tiên tính là giỗ năm thứ 1 hoặc năm giỗ đầu
        anniversaryYearsText = `<div class="anniversary-badge">Giỗ năm thứ ${yearsCount}</div>`;
      }
    }

    let locationParts = [];
    if (khu) locationParts.push(`Lô ${khu}`);
    if (day) locationParts.push(`Tầng ${day}`);
    if (soHoc) locationParts.push(`Ngăn ${soHoc}`);
    const locationText = locationParts.join(' - ') || 'Chưa định vị';

    // Định dạng Sinh - Mất chuẩn mẫu
    let lifeSpanHtml = '';
    if (ngaySinh || ngayMat) {
      lifeSpanHtml = `<div class="today-lifespan">Sinh ${ngaySinh || '?'} ✝ Mất ${ngayMat || '?'}</div>`;
    }

    const card = document.createElement('div');
    card.className = 'today-card';
    card.innerHTML = `
      <div class="today-info">
        <div class="saint-name">${tenThanh}</div>
        <div class="full-name">${hoTen}</div>
        ${lifeSpanHtml}
        ${anniversaryYearsText}
      </div>
      <div class="today-loc-box">
        <div class="loc-label">MÃ SỐ - VỊ TRÍ HÀI CỐT</div>
        <div class="loc-value">${locationText}</div>
      </div>
      <div class="prayer-actions">
        <button class="action-btn" onclick="triggerAction(this, '🕯️ Đã thắp nến')">🕯️ Thắp nến</button>
        <button class="action-btn" onclick="triggerAction(this, '🌸 Đã tặng hoa')">🌸 Tặng hoa</button>
        <button class="action-btn" onclick="triggerAction(this, '❤️ Đã bày tỏ')">❤️ Thương nhớ</button>
        <button class="action-btn" onclick="triggerAction(this, '🙏 Đã cầu nguyện')">🙏 Cầu nguyện</button>
      </div>
    `;
    container.appendChild(card);
  });
}

// Hiệu ứng bấm nút Thắp nến / Tặng hoa / Thả tim / Cầu nguyện
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

// Hàm hiển thị kết quả tìm kiếm thông thường
function displayData(data) {
  const grid = document.getElementById('resultsGrid');
  const countEl = document.getElementById('recordCount');
  grid.innerHTML = '';

  countEl.innerText = `Tìm thấy ${data.length} kết quả`;

  if (data.length === 0) {
    grid.innerHTML = '<p style="text-align: center; color: #777; padding: 2rem; grid-column: 1/-1;">Không tìm thấy thông tin phù hợp.</p>';
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
          ${ghichu ? `<span style="width: 100%; font-style: italic; color: #555;">📝 Ghi chú: ${ghichu}</span>` : ''}
        </div>
      </div>
      <div class="location-badge">
        📍 Vị trí<br>${locationText}
      </div>
    `;
    grid.appendChild(card);
  });
}

// Lọc dữ liệu khi gõ ô tìm kiếm
function filterData() {
  const rawQuery = document.getElementById('searchInput').value.trim();
  const query = removeAccents(rawQuery.toLowerCase());
  const grid = document.getElementById('resultsGrid');
  
  if (!query) {
    grid.innerHTML = '<p class="search-hint">Vui lòng nhập thông tin vào ô tìm kiếm ở trên để tra cứu vị trí hài cốt thân nhân.</p>';
    document.getElementById('recordCount').innerText = 'Sẵn sàng tra cứu';
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
