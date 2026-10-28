// Link Google Sheet công khai định dạng CSV
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
      displayData(allData);
    },
    error: function(err) {
      document.getElementById('loading').innerHTML = '<span style="color: red;">Không thể tải dữ liệu. Vui lòng kiểm tra lại liên kết Dịch vụ công Công Giáo</span>';
    }
  });
});

function removeAccents(str) {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

function displayData(data) {
  const grid = document.getElementById('resultsGrid');
  const countEl = document.getElementById('recordCount');
  grid.innerHTML = '';

  countEl.innerText = `Tìm thấy ${data.length} kết quả`;

  if (data.length === 0) {
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #777; padding: 2rem;">Không tìm thấy thông tin phù hợp.</p>';
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
      <div class="card-header">
        <div>
          <div class="saint-name">${tenThanh}</div>
          <div class="full-name">${hoTen}</div>
        </div>
        <div class="location-badge">${locationText}</div>
      </div>
      <div class="card-body">
        ${(ngaySinh || ngayMat) ? `<p class="dates"><strong>Sinh - Mất:</strong> ${ngaySinh || '?'} – ${ngayMat || '?'}</p>` : ''}
        ${ngayGioDuong ? `<p class="anniversary"><strong>Ngày giỗ:</strong> ${ngayGioDuong}</p>` : ''}
        ${ghichu ? `<p class="notes"><strong>Ghi chú:</strong> ${ghichu}</p>` : ''}
      </div>
    `;
    grid.appendChild(card);
  });
}

function filterData() {
  const rawQuery = document.getElementById('searchInput').value.trim();
  const query = removeAccents(rawQuery.toLowerCase());
  
  if (!query) {
    displayData(allData);
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
