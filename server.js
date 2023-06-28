// imports the 'inquirer' module
const inquirer = require('inquirer');
//imports the 'mysql2' module
const mysql = require('mysql2');
//imports the 'console.table' module
const cTable = require('console.table');
// imports the 'dotenv' module and executes its 'config' method
require('dotenv').config();

//creates a connection object with the provided configuration
const connection = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '123',
    database: 'employeeTrackerDB',
});

// establishes a connection to the MySQL database server 
// handles any potential errors
connection.connect((err) => {
    if (err) throw err;
    console.log(`Connected as id ${connection.threadId} \n`);
    startApp();
});

//sets up the user interface by presenting choices to the user 
//captures their selection
//executes the corresponding functionality based on their choice
startApp = () => {
    inquirer.prompt([
        {
            name: 'initialInquiry',
            type: 'rawlist',
            message: 'Welcome to the employee management program. What would you like to do?',
            choices: ['View all departments', 'View all roles', 'View all employees', 'View all employees by manager', 'Add a department', 'Add a role', 'Add an employee', 'Update employee\'s role', 'Update employee\'s manager', 'Remove a department', 'Remove a role', 'Remove an employee', 'View total salary of department', 'Exit program']
        }
    ]).then((response) => {
        switch (response.initialInquiry) {
            case 'View all departments':
                viewAllDepartments();    
                break;
            case 'View all roles':
                viewAllRoles();
                break;
            case 'View all employees':
                viewAllEmployees();
                break;
            case 'View all employees by manager':
                viewAllEmployeesByManager();
            break;
            case 'Add a department':
                addADepartment();
            break;
            case 'Add a role':
                addARole();
            break;
            case 'Add an employee':
                addAnEmployee();
            break;
            case 'Update employee\'s role':
                updateEmployeeRole();
            break;
            case 'Update employee\'s manager':
                updateEmployeesManager();
            break;
            case 'Remove a department':
                removeADepartment();
            break;
            case 'Remove a role':
                removeARole();
            break;
            case 'Remove an employee':
                removeAnEmployee();
            break;
            case 'View total salary of department':
                viewDepartmentSalary();
            break;
            case 'Exit program':
                connection.end();
                console.log('\n You have exited the employee management program. Thanks for using! \n');
                return;
            default:
                break;
        }
    })
}

// Function to view all departments
viewAllDepartments = () => {
    // Query to retrieve all departments
    connection.query(`SELECT * FROM department ORDER BY department_id ASC;`, (err, res) => {
      if (err) throw err;
      // Displaying the result as a table
      console.table('\n', res, '\n');
      startApp();
    });
  };
  

// Function to view all roles
viewAllRoles = () => {
    // Query to retrieve all roles along with their details
    connection.query(`SELECT role.role_id, role.title, role.salary, department.department_name, department.department_id FROM role JOIN department ON role.department_id = department.department_id ORDER BY role.role_id ASC;`, (err, res) => {
      if (err) throw err;
      // Displaying the result as a table
      console.table('\n', res, '\n');
      startApp();
    });
  };
  
  // Function to view all employees
  viewAllEmployees = () => {
    // Query to retrieve all employees along with their details, including their manager's name
    connection.query(`SELECT e.employee_id, e.first_name, e.last_name, role.title, department.department_name, role.salary, CONCAT(m.first_name, ' ', m.last_name) manager FROM employee m RIGHT JOIN employee e ON e.manager_id = m.employee_id JOIN role ON e.role_id = role.role_id JOIN department ON department.department_id = role.department_id ORDER BY e.employee_id ASC;`, (err, res) => {
      if (err) throw err;
      // Displaying the result as a table
      console.table('\n', res, '\n');
      startApp();
    });
  };
  

// Function to view all employees under a specific manager
viewAllEmployeesByManager = () => {
    // Query to retrieve the list of employees with their IDs and names
    connection.query(`SELECT employee_id, first_name, last_name FROM employee ORDER BY employee_id ASC;`, (err, res) => {
      if (err) throw err;
      // Mapping the result to create a list of managers with their IDs and names
      let managers = res.map(employee => ({ name: employee.first_name + ' ' + employee.last_name, value: employee.employee_id }));
      
      // Prompting the user to select a manager
      inquirer.prompt([
        {
          name: 'manager',
          type: 'rawlist',
          message: 'Which manager would you like to see the employees of?',
          choices: managers
        },
      ]).then((response) => {
        // Query to retrieve the employees under the selected manager
        connection.query(`SELECT e.employee_id, e.first_name, e.last_name, role.title, department.department_name, role.salary, CONCAT(m.first_name, ' ', m.last_name) manager FROM employee m RIGHT JOIN employee e ON e.manager_id = m.employee_id JOIN role ON e.role_id = role.role_id JOIN department ON department.department_id = role.department_id WHERE e.manager_id = ${response.manager} ORDER BY e.employee_id ASC`,
          (err, res) => {
            if (err) throw err;
            // Displaying the result as a table
            console.table('\n', res, '\n');
            startApp();
          });
      });
    });
  };
  

// Function to add a department to the database
addADepartment = () => {
    // Prompting the user to enter the name of the new department
    inquirer.prompt([
      {
        name: 'newDept',
        type: 'input',
        message: 'What is the name of the department you want to add?'
      }
    ]).then((response) => {
      // Inserting the new department into the database
      connection.query(`INSERT INTO department SET ?`,
        {
          department_name: response.newDept,
        },
        (err, res) => {
          if (err) throw err;
          console.log(`\n${response.newDept} successfully added to the database!\n`);
          startApp();
        });
    });
  };
  

// Function to add a role to the database
addARole = () => {
    // Query to retrieve all departments from the database
    connection.query(`SELECT * FROM department;`, (err, res) => {
      if (err) throw err;
      // Mapping the department results to create choices for inquirer prompt
      let departments = res.map(department => ({ name: department.department_name, value: department.department_id }));
  
      // Prompting the user to enter details for the new role
      inquirer.prompt([
        {
          name: 'title',
          type: 'input',
          message: 'What is the name of the role you want to add?'
        },
        {
          name: 'salary',
          type: 'input',
          message: 'What is the salary of the role you want to add?'
        },
        {
          name: 'deptName',
          type: 'rawlist',
          message: 'Which department do you want to add the new role to?',
          choices: departments
        },
      ]).then((response) => {
        // Inserting the new role into the database
        connection.query(
          `INSERT INTO role SET ?`,
          {
            title: response.title,
            salary: response.salary,
            department_id: response.deptName,
          },
          (err, res) => {
            if (err) throw err;
            console.log(`\n${response.title} successfully added to the database!\n`);
            startApp();
          }
        );
      });
    });
  };
  

// Function to add an employee to the database
addAnEmployee = () => {
    // Query to retrieve all roles from the database
    connection.query(`SELECT * FROM role;`, (err, roleRes) => {
      if (err) throw err;
      // Mapping the role results to create choices for inquirer prompt
      const roles = roleRes.map(role => ({ name: role.title, value: role.role_id }));
  
      // Query to retrieve all employees from the database
      connection.query(`SELECT * FROM employee;`, (err, empRes) => {
        if (err) throw err;
        // Mapping the employee results to create choices for inquirer prompt
        const employees = empRes.map(employee => ({ name: `${employee.first_name} ${employee.last_name}`, value: employee.employee_id }));
  
        // Prompting the user to enter details for the new employee
        inquirer.prompt([
          {
            name: 'firstName',
            type: 'input',
            message: "What is the new employee's first name?",
          },
          {
            name: 'lastName',
            type: 'input',
            message: "What is the new employee's last name?",
          },
          {
            name: 'role',
            type: 'rawlist',
            message: "What is the new employee's title?",
            choices: roles,
          },
          {
            name: 'manager',
            type: 'rawlist',
            message: "Who is the new employee's manager?",
            choices: employees,
          },
        ]).then((response) => {
          const { firstName, lastName, role, manager } = response;
  
          // Inserting the new employee into the database
          connection.query(
            `INSERT INTO employee SET ?`,
            {
              first_name: firstName,
              last_name: lastName,
              role_id: role,
              manager_id: manager,
            },
            (err, res) => {
              if (err) throw err;
              console.log(`\n${firstName} ${lastName} successfully added to the database!\n`);
              startApp();
            }
          );
        });
      });
    });
  };
  

// Function to update an employee's role
updateEmployeeRole = () => {
    connection.query(`SELECT * FROM role;`, (err, res) => {
      if (err) throw err;
      let roles = res.map(role => ({ name: role.title, value: role.role_id }));
      connection.query(`SELECT * FROM employee;`, (err, res) => {
        if (err) throw err;
        let employees = res.map(employee => ({ name: employee.first_name + ' ' + employee.last_name, value: employee.employee_id }));
        inquirer.prompt([
          {
            name: 'employee',
            type: 'rawlist',
            message: 'Which employee would you like to update the role for?',
            choices: employees
          },
          {
            name: 'newRole',
            type: 'rawlist',
            message: 'What should the employee\'s new role be?',
            choices: roles
          },
        ]).then((response) => {
          connection.query(
            `UPDATE employee SET ? WHERE ?`,
            [
              {
                role_id: response.newRole,
              },
              {
                employee_id: response.employee,
              },
            ],
            (err, res) => {
              if (err) throw err;
              console.log(`\n Successfully updated employee's role in the database! \n`);
              startApp();
            }
          );
        });
      });
    });
  };
  
  // Function to update an employee's manager
  updateEmployeesManager = () => {
    connection.query(`SELECT * FROM employee;`, (err, res) => {
      if (err) throw err;
      let employees = res.map(employee => ({ name: employee.first_name + ' ' + employee.last_name, value: employee.employee_id }));
      inquirer.prompt([
        {
          name: 'employee',
          type: 'rawlist',
          message: 'Which employee would you like to update the manager for?',
          choices: employees
        },
        {
          name: 'newManager',
          type: 'rawlist',
          message: 'Who should the employee\'s new manager be?',
          choices: employees
        },
      ]).then((response) => {
        connection.query(
          `UPDATE employee SET ? WHERE ?`,
          [
            {
              manager_id: response.newManager,
            },
            {
              employee_id: response.employee,
            },
          ],
          (err, res) => {
            if (err) throw err;
            console.log(`\n Successfully updated employee's manager in the database! \n`);
            startApp();
          }
        );
      });
    });
  };
  

// Function to remove a department
removeADepartment = () => {
    connection.query(`SELECT * FROM department ORDER BY department_id ASC;`, (err, res) => {
      if (err) throw err;
      let departments = res.map(department => ({ name: department.department_name, value: department.department_id }));
      inquirer.prompt([
        {
          name: 'deptName',
          type: 'rawlist',
          message: 'Which department would you like to remove?',
          choices: departments
        },
      ]).then((response) => {
        connection.query(
          `DELETE FROM department WHERE ?`,
          [
            {
              department_id: response.deptName,
            },
          ],
          (err, res) => {
            if (err) throw err;
            console.log(`\n Successfully removed the department from the database! \n`);
            startApp();
          }
        );
      });
    });
  };
  
  // Function to remove a role
  removeARole = () => {
    connection.query(`SELECT * FROM role ORDER BY role_id ASC;`, (err, res) => {
      if (err) throw err;
      let roles = res.map(role => ({ name: role.title, value: role.role_id }));
      inquirer.prompt([
        {
          name: 'title',
          type: 'rawlist',
          message: 'Which role would you like to remove?',
          choices: roles
        },
      ]).then((response) => {
        connection.query(
          `DELETE FROM role WHERE ?`,
          [
            {
              role_id: response.title,
            },
          ],
          (err, res) => {
            if (err) throw err;
            console.log(`\n Successfully removed the role from the database! \n`);
            startApp();
          }
        );
      });
    });
  };
  
// Function to remove anemployee
removeAnEmployee = () => {
    connection.query(`SELECT * FROM employee ORDER BY employee_id ASC;`, (err, res) => {
        if (err) throw err;
        let employees = res.map(employee => ({name: employee.first_name + ' ' + employee.last_name, value: employee.employee_id }));
        inquirer.prompt([
            {
                name: 'employee',
                type: 'rawlist',
                message: 'Which employee would you like to remove?',
                choices: employees
            },
        ]).then((response) => {
            connection.query(`DELETE FROM employee WHERE ?`, 
            [
                {
                    employee_id: response.employee,
                },
            ], 
            (err, res) => {
                if (err) throw err;
                console.log(`\n Successfully removed the employee from the database! \n`);
                startApp();
            })
        })
    })
}

// Function to view the total salary of a department
viewDepartmentSalary = () => {
    connection.query(`SELECT * FROM department ORDER BY department_id ASC;`, (err, res) => {
      if (err) throw err;
      let departments = res.map(department => ({ name: department.department_name, value: department.department_id }));
      inquirer.prompt([
        {
          name: 'deptName',
          type: 'rawlist',
          message: 'Which department would you like to view the total salaries of?',
          choices: departments
        },
      ]).then((response) => {
        connection.query(
          `SELECT department_id, SUM(role.salary) AS total_salary FROM role WHERE ?`,
          [
            {
              department_id: response.deptName,
            },
          ],
          (err, res) => {
            if (err) throw err;
            console.log(`\n The total utilized salary budget of the ${response.deptName} department is $ \n`);
            console.table('\n', res, '\n');
            startApp();
          }
        );
      });
    });
  };
  