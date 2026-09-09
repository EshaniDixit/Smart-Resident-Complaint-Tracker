import { findDuplicates } from './src/lib/classify.js';

const existingComplaints = [
  {
    id: '1',
    description: 'The water pipes are all leaking in flat 404. Everything is destroyed, everything is wet. The kitchen is leaking, bedroom is leaking and the clothes are all leaking, It leaks more when wee open the ytaps and nothing is staying',
    status: 'IN_PROGRESS',
    createdAt: new Date(),
  }
];

const newDescription = 'THE PIPES ARE LEAKING EVERYWHERE';

const duplicates = findDuplicates(newDescription, existingComplaints);
console.log('Duplicates:', duplicates);
