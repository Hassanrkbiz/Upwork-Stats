console.log('Content script works!');
console.log('Must reload extension for modifications to take effect.');
import './arrive.js';

declare global {
  interface Document {
    arrive: any;
  }
  interface Element {
    href: string;
  }
}

function getProfileDetails(cyperText: string) {
  return fetch(
    `https://www.upwork.com/freelancers/api/v1/freelancer/profile/${cyperText}/details`
  )
    .then((res) => {
      return res.json();
    })
    .then((data) => {
      return data;
    })
    .catch((err) => {
      return null;
    });
}

function getStats(data: any) {
  if (data && data?.profile && data?.profile?.stats)
    return data?.profile?.stats;
  else return null;
}

function filterStats(stats: any) {
  if (stats) {
    return {
      'Total Earning': stats?.totalEarningsNumValue
        ? `$${stats?.totalEarningsNumValue.toFixed(1)}`
        : null,
      Rating: stats?.rating ? `${stats?.rating.toFixed(1)} &#9733;` : null,
      'Total Revenue': stats?.totalRevenue
        ? `$${stats?.totalRevenue.toFixed(1)}`
        : null,
      'Hire Again %': stats?.hireAgainPercentage
        ? `${stats?.hireAgainPercentage.toFixed(1)} %`
        : null,
      'Fixed Jobs': stats?.totalFixedJobs ?? null,
      'Hourly Jobs': stats?.totalHourlyJobs ?? null,
      //   'Active Interviews': stats?.activeInterviews ?? null,
      //   'Active Assignments': stats?.activeAssignments ?? null,
      //   'Contractor Earning': stats?.contractorEarningsNumValue ?? null,
      //   'Total Feedbacks': stats?.totalFeedbacks ?? null,
    };
  }
}

function getCyperText(url: string) {
  console.log('url', url);
  var cyperText: any = '';
  var split = url.split('https://www.upwork.com/freelancers/');
  console.log('split', split);
  if (split.length > 1) cyperText = split[1];
  else return '';
  cyperText = cyperText?.split('/')[0];
  cyperText = cyperText?.split('?')[0];
  return cyperText;
}

function statElem(key: string, value: any) {
  return `<div class="col-compact"><div class="stat-amount h5"><span>${value}</span></div> <div><span class="text-base-sm text-light-on-inverse">${key}</span></div></div>`;
}

function main() {
  document.arrive('[itemprop="name"]', async (e: any) => {
    console.log('e', e);
    var previewMode = document.querySelectorAll('.air3-slider-header a');
    var url = window.location.href;
    if (previewMode.length > 0) url = previewMode[0].href;
    var cyperText = getCyperText(url);
    console.log('cyperText', cyperText);
    if (cyperText === '') {
      console.log('cyperText not found');
      return;
    }

    var profileDetails = await getProfileDetails(cyperText);
    var stats = getStats(profileDetails);
    var filteredStats = filterStats(stats);
    console.log('filteredStats', filteredStats);

    if (filteredStats) {
      insertStats(filteredStats);
    }
  });
}

main();

function insertStats(stats: any) {
  var statSection: any = document.querySelector(
    '.cfe-ui-profile-summary-stats > div'
  );
  var elemList: any = [];
  if (statSection) {
    Object.entries(stats).forEach(([key, value], index) => {
      if (value) {
        elemList.push(statElem(key, value));
      }
    });
    appendElements(statSection, elemList);
  } else {
    document.arrive('.cfe-ui-profile-summary-stats > div', (e: any) => {
      Object.entries(stats).forEach(([key, value]) => {
        if (value) {
          elemList.push(statElem(key, value));
        }
      });
      appendElements(e, elemList);
    });
  }
}

function appendElements(e: any, list: Array<string>) {
  removeOldStats();
  if (list.length > 0) {
    var div = document.createElement('div');
    div.setAttribute('upwork-stats', 'true');
    div.className = 'd-flex space-between';
    // slice first 3 elements
    div.innerHTML = list.slice(0, 3).join('');
    e.appendChild(div);
  }
  if (list.length > 2) {
    // append the remaining elements
    var div = document.createElement('div');
    div.setAttribute('upwork-stats', 'true');
    div.className = 'd-flex space-between';
    div.innerHTML = list.slice(3).join('');
    e.appendChild(div);
  }
}

function removeOldStats() {
  document
    .querySelectorAll('[upwork-stats="true"]')
    .forEach((element) => element.remove());
}
