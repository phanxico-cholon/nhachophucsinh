// Link Google Sheet công khai định dạng CSV của Nhà Chờ Phục Sinh
const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQDqsKXut4tys4GoS-D19eQ_hthJIhLXxX8a6_neYoavoIOpbMgnHPOH8wlvSO-N783DrjUZfWRCPYc/pub?gid=1625617362&single=true&output=csv';

let allData = [];

window.addEventListener('DOMContentLoaded', () => {
  Papa.parse(csvUrl, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function(results) {
      allData = results.data;
      document.getElementById('loading').style.display = 'none';
      
      // Hiển thị danh sách các linh hồn có ngày giỗ hôm nay vào phần Cầu Nguyện
      displayTodayAnniversary(allData);
      
      // Mới vào: không hiển thị danh sách tìm kiếm để giao diện gọn gàng
      document.getElementById('resultsGrid').innerHTML = '<p class="search-hint">Vui lòng nhập thông tin vào ô tìm kiếm ở trên để tra cứu vị trí hài cốt thân nhân.</p>';
      document.getElementById('recordCount').innerText = 'Sẵn sàng tra cứu';
    },
    error: function(err) {
      document.getElementById('loading').innerHTML = '<span style="color: red;">Không thể tải dữ liệu từ Nhà chờ Phục Sinh. Vui lòng kiểm tra lại liên kết để mở cửa Nhà chờ Phục Sinh!</span>';
    }
  });
});

// Hàm hỗ trợ bỏ dấu tiếng Việt để tìm kiếm chính xác hơn
function removeAccents(str) {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

// Lấy ngày hiện tại định dạng dd/mm (ví dụ: "28/10")
function getTodayString() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

// Hiển thị danh sách Cầu Nguyện Hôm Nay (trùng ngày giỗ ngayGioDuong)
function displayTodayAnniversary(data) {
  const todayStr = getTodayString(); // Lấy ngày tháng hiện tại
  const container = document.getElementById('todayAnniversaryList');
  const section = document.getElementById('todayAnniversarySection');
  
  if (!container || !section) return;

  // Lọc những người có ngayGioDuong chứa ngày hôm nay (hỗ trợ định dạng dd/mm hoặc dd/mm/yyyy)
  const todayList = data.filter(item => {
    const gio = item['ngayGioDuong'] ? item['ngayGioDuong'].trim() : '';
    return gio && (gio === todayStr || gio.startsWith(todayStr + '/'));
  });

  if (todayList.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  container.innerHTML = '';

  todayList.forEach(item => {
    const tenThanh = item['tenThanh'] || '';
    const hoTen = item['hoTen'] || '';
    const khu = item['khu'] || '';
    const day = item['day'] || '';
    const soHoc = item['soHoc'] || '';

    let locationParts = [];
    if (khu) locationParts.push(`Lô ${khu}`);
    if (day) locationParts.push(`Tầng ${day}`);
    if (soHoc) locationParts.push(`Ngăn ${soHoc}`);
    const locationText = locationParts.join(' - ') || '';

    const card = document.createElement('div');
    card.className = 'today-card';
    card.innerHTML = `
      <div class="today-info">
        <div class="saint-name">${tenThanh}</div>
        <div class="full-name">${hoTen}</div>
        ${locationText ? `<div class="today-loc">📍 ${locationText}</div>` : ''}
      </div>
      <div class="prayer-actions">
        <button class="action-btn" onclick="triggerAction(this, '🕯️ Đã thắp nến')">🕯️ Thắp nến</button>
        <button class="action-btn" onclick="triggerAction(this, '🌸 Đã tặng hoa')">🌸 Tặng hoa</button>
        <button class="action-btn" onclick="triggerAction(this, '🙏 Đã hiệp ý cầu nguyện')">🙏 Cầu nguyện</button>
      </div>
    `;
    container.appendChild(card);
  });
}

// Hiệu ứng khi bấm nút Thắp nến / Tặng hoa / Cầu nguyện
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

// Hàm hiển thị kết quả tìm kiếm
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

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-info">
        <div class="saint-name">${tenThanh}</div>
        <div class="full-name">${hoTen}</div>
        <div class="card-details">
          ${(ngaySinh || ngayMat) ? `<span>📅 Sinh-Mất: <strong>${ngaySinh || '?'} – ${ngayMat || '?'}</strong></span>` : ''}
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

// Lọc dữ liệu theo từ khóa tìm kiếm
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
