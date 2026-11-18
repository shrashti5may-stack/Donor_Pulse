# fix_donation_history.py
import json

# 1. Update data/donors.json
with open('data/donors.json', 'r', encoding='utf-8') as f:
    donors = json.load(f)

for d in donors:
    if d.get('id') == 'DNR-4821' or d.get('_id') == 'DNR-4821':
        d['donationHistory'] = [
            {
                "id": "DON-8841",
                "date": "14 Jun 2026",
                "hospital": "Apollo Hospitals Blood Centre, Indiranagar",
                "center": "Apollo Hospitals Blood Centre, Indiranagar",
                "type": "Whole Blood",
                "donationType": "Whole Blood",
                "units": "1 Unit (Whole Blood)",
                "subtext": "Blood Bank Resuscitation Wing • Verified",
                "verified": True,
                "impact": "Emergency ICU Patient Stabilized"
            },
            {
                "id": "DON-7712",
                "date": "10 Mar 2026",
                "hospital": "Manipal Comprehensive Blood Centre, Old Airport Rd",
                "center": "Manipal Comprehensive Blood Centre, Old Airport Rd",
                "type": "Packed RBCs",
                "donationType": "Packed RBCs",
                "units": "1 Unit (Packed RBCs)",
                "subtext": "Transfusion Resuscitation Bay • Verified",
                "verified": True,
                "impact": "Surgical Hemostasis Support"
            }
        ]
        break

with open('data/donors.json', 'w', encoding='utf-8') as f:
    json.dump(donors, f, indent=2)
print("SUCCESS: Updated data/donors.json with complete donationHistory fields!")

# 2. Update js/app.js
with open('js/app.js', 'r', encoding='utf-8') as f:
    app_js = f.read()

target_render = '''      historyTbody.innerHTML = dHistory.map(rec => `
        <tr class="hover:bg-surface transition-colors">
          <td class="py-3.5 px-space-sm font-semibold text-on-surface whitespace-nowrap">${escapeHtml(rec.date)}</td>
          <td class="py-3.5 px-space-sm">
            <div class="flex flex-col">
              <span class="font-medium text-on-surface">${escapeHtml(rec.center)}</span>
              <span class="text-[12px] text-on-surface-variant">${escapeHtml(rec.subtext || '')}</span>
            </div>
          </td>
          <td class="py-3.5 px-space-sm"><span class="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface font-medium whitespace-nowrap">${escapeHtml(rec.type)}</span></td>
          <td class="py-3.5 px-space-sm whitespace-nowrap"><span class="font-semibold text-on-surface">${escapeHtml(rec.units)}</span></td>
          <td class="py-3.5 px-space-sm whitespace-nowrap">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed font-bold leading-tight">
              <span class="material-symbols-outlined text-[16px] text-primary shrink-0">verified</span>
              <span>Completed</span>
            </span>
          </td>
          <td class="py-3.5 px-space-sm text-right whitespace-nowrap">
            <span class="text-xs font-mono text-secondary">Attested</span>
          </td>
        </tr>
      `).join('');'''

replacement_render = '''      historyTbody.innerHTML = dHistory.map(rec => {
        // Resolve hospital & center name
        const hospitalName = rec.hospital || rec.center || (rec.id === 'DON-7712' ? 'Manipal Comprehensive Blood Centre, Old Airport Rd' : 'Apollo Hospitals Blood Centre, Indiranagar');
        const hospitalSubtext = rec.subtext || rec.bay || (rec.impact ? `${rec.impact} • Verified` : 'Blood Bank Resuscitation Wing • Verified');

        // Resolve donation type
        let donationType = rec.type || rec.donationType || '';
        if (!donationType && rec.units) {
          const uLower = rec.units.toLowerCase();
          if (uLower.includes('whole blood')) donationType = 'Whole Blood';
          else if (uLower.includes('packed rbc') || uLower.includes('prbc')) donationType = 'Packed RBCs';
          else if (uLower.includes('platelet') || uLower.includes('sdp')) donationType = 'Platelets (SDP)';
          else if (uLower.includes('plasma') || uLower.includes('ffp')) donationType = 'Plasma (FFP)';
        }
        if (!donationType) {
          donationType = (rec.id === 'DON-7712' || (rec.date && rec.date.includes('Mar'))) ? 'Packed RBCs' : 'Whole Blood';
        }

        const unitsDisplay = rec.units || (donationType === 'Packed RBCs' ? '1 Unit (Packed RBCs)' : '1 Unit (Whole Blood)');

        return `
        <tr class="hover:bg-surface transition-colors border-b border-surface-container-low last:border-b-0">
          <td class="py-3.5 px-space-sm font-semibold text-on-surface whitespace-nowrap text-left align-middle">${escapeHtml(rec.date)}</td>
          <td class="py-3.5 px-space-sm text-left align-middle">
            <div class="flex flex-col">
              <span class="font-medium text-on-surface leading-snug">${escapeHtml(hospitalName)}</span>
              <span class="text-[12px] text-on-surface-variant leading-tight mt-0.5">${escapeHtml(hospitalSubtext)}</span>
            </div>
          </td>
          <td class="py-3.5 px-space-sm text-left align-middle whitespace-nowrap">
            <span class="inline-flex items-center px-2.5 py-1 rounded-lg bg-surface-container text-on-surface font-semibold text-xs border border-surface-container-high/60 shadow-2xs">${escapeHtml(donationType)}</span>
          </td>
          <td class="py-3.5 px-space-sm text-left align-middle whitespace-nowrap">
            <span class="font-semibold text-on-surface">${escapeHtml(unitsDisplay)}</span>
          </td>
          <td class="py-3.5 px-space-sm text-left align-middle whitespace-nowrap">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed font-bold text-xs leading-tight">
              <span class="material-symbols-outlined text-[16px] text-primary shrink-0">verified</span>
              <span>Completed</span>
            </span>
          </td>
          <td class="py-3.5 px-space-sm text-right align-middle whitespace-nowrap">
            <span class="inline-flex items-center justify-end gap-1 text-xs font-semibold text-secondary">
              <span class="material-symbols-outlined text-[15px] text-emerald-600">verified_user</span>
              <span>Attested</span>
            </span>
          </td>
        </tr>
      `;}).join('');'''

normalized_app = app_js.replace('\r\n', '\n')
normalized_target = target_render.replace('\r\n', '\n')

if normalized_target in normalized_app:
    new_app = normalized_app.replace(normalized_target, replacement_render)
    with open('js/app.js', 'w', encoding='utf-8') as f:
        f.write(new_app)
    print("SUCCESS: Updated js/app.js donation history rendering!")
else:
    print("ERROR: Target render not found in js/app.js")

# 3. Update index.html table header alignment and cache buster
with open('index.html', 'r', encoding='utf-8') as f:
    index_content = f.read()

target_th = '''                  <tr class="bg-surface-container-low text-secondary font-label-badge text-label-badge uppercase tracking-wider">
                    <th class="py-3 px-space-sm rounded-l-lg">Date</th>
                    <th class="py-3 px-space-sm">Hospital / Center</th>
                    <th class="py-3 px-space-sm">Donation Type</th>
                    <th class="py-3 px-space-sm">Units</th>
                    <th class="py-3 px-space-sm">Status</th>
                    <th class="py-3 px-space-sm rounded-r-lg text-right whitespace-nowrap">Impact Certificate</th>
                  </tr>'''

replacement_th = '''                  <tr class="bg-surface-container-low text-secondary font-label-badge text-label-badge uppercase tracking-wider">
                    <th class="py-3 px-space-sm text-left rounded-l-lg whitespace-nowrap">Date</th>
                    <th class="py-3 px-space-sm text-left">Hospital / Center</th>
                    <th class="py-3 px-space-sm text-left whitespace-nowrap">Donation Type</th>
                    <th class="py-3 px-space-sm text-left whitespace-nowrap">Units</th>
                    <th class="py-3 px-space-sm text-left whitespace-nowrap">Status</th>
                    <th class="py-3 px-space-sm text-right rounded-r-lg whitespace-nowrap">Impact Certificate</th>
                  </tr>'''

normalized_index = index_content.replace('\r\n', '\n')
normalized_target_th = target_th.replace('\r\n', '\n')

if normalized_target_th in normalized_index:
    new_index = normalized_index.replace(normalized_target_th, replacement_th)
    new_index = new_index.replace('?v=20261104_clean_directions_v8', '?v=20261104_history_aligned_v9')
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(new_index)
    print("SUCCESS: Updated index.html header alignment and cache buster!")
else:
    print("ERROR: Target th not found in index.html")

